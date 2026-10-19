package com.aistudio.sabtools.logic

import com.aistudio.sabtools.model.CutLine
import com.aistudio.sabtools.model.CuttingOptimizationResult
import com.aistudio.sabtools.model.CuttingPart
import com.aistudio.sabtools.model.CuttingStock
import com.aistudio.sabtools.model.CuttingSummary
import com.aistudio.sabtools.model.OptimizedSheet
import com.aistudio.sabtools.model.PlacedPart
import com.aistudio.sabtools.model.SheetOffcut
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

object CuttingOptimizer {
    private const val EPS = 1e-7

    private data class Rect(val x: Double, val y: Double, val w: Double, val h: Double)
    private data class Orientation(val w: Double, val h: Double, val rotated: Boolean)
    private data class CutResult(val children: List<Rect>, val cuts: List<CutLine>)

    private data class ActiveSheet(
        val sheetIndex: Int,
        val name: String,
        val material: String,
        val length: Double,
        val width: Double,
        val thickness: Double,
        val grain: String,
        val offcut: Boolean,
        val free: MutableList<Rect>,
        val placements: MutableList<PlacedPart>,
        val cuts: MutableList<CutLine>
    )

    private fun split(rect: Rect, o: Orientation, k: Double, axis: String): CutResult? {
        val dw = rect.w - o.w
        val dh = rect.h - o.h
        if (dw < -EPS || dh < -EPS) return null
        if ((dw > EPS && dw + EPS < k) || (dh > EPS && dh + EPS < k)) return null

        val children = mutableListOf<Rect>()
        val cuts = mutableListOf<CutLine>()

        val addVerticalCut = { r: Rect, pos: Double ->
            if (r.w - pos > EPS) {
                cuts.add(
                    CutLine(
                        number = 0,
                        axis = "vertical",
                        x = r.x + pos,
                        y = r.y,
                        span = r.h,
                        distance = pos,
                        partName = ""
                    )
                )
                if (r.w - pos - k > EPS) {
                    children.add(Rect(x = r.x + pos + k, y = r.y, w = r.w - pos - k, h = r.h))
                }
            }
        }

        val addHorizontalCut = { r: Rect, pos: Double ->
            if (r.h - pos > EPS) {
                cuts.add(
                    CutLine(
                        number = 0,
                        axis = "horizontal",
                        x = r.x,
                        y = r.y + pos,
                        span = r.w,
                        distance = pos,
                        partName = ""
                    )
                )
                if (r.h - pos - k > EPS) {
                    children.add(Rect(x = r.x, y = r.y + pos + k, w = r.w, h = r.h - pos - k))
                }
            }
        }

        if (axis == "vertical") {
            addVerticalCut(rect, o.w)
            addHorizontalCut(Rect(rect.x, rect.y, o.w, rect.h), o.h)
        } else {
            addHorizontalCut(rect, o.h)
            addVerticalCut(Rect(rect.x, rect.y, rect.w, o.h), o.w)
        }

        return CutResult(children, cuts)
    }

    fun optimize(
        stocks: List<CuttingStock>,
        parts: List<CuttingPart>,
        kerf: Double = 3.0,
        trim: Double = 5.0
    ): CuttingOptimizationResult {
        if (stocks.isEmpty() || parts.isEmpty()) {
            return CuttingOptimizationResult(
                sheets = emptyList(),
                summary = CuttingSummary(0, 0, 0, 0.0, 0.0, 0.0, 0.0, 0.0, 0),
                unplacedParts = emptyList()
            )
        }

        // Expand stocks into single units
        val availableStock = stocks.flatMap { s ->
            List(s.quantity) { idx -> s.copy(name = "${s.name} #${idx + 1}") }
        }.toMutableList()

        // Expand parts into single units
        val expandedParts = parts.flatMap { p ->
            List(p.quantity) { idx -> p.copy(name = "${p.name} #${idx + 1}") }
        }.sortedByDescending { it.length * it.width }

        val activeSheets = mutableListOf<ActiveSheet>()
        val unplaced = mutableListOf<String>()

        var sheetCounter = 1

        for (part in expandedParts) {
            var placed = false

            // Try existing opened sheets first
            for (sheet in activeSheets) {
                if (!sheet.material.equals(part.material, ignoreCase = true) ||
                    abs(sheet.thickness - part.thickness) > 0.1
                ) continue

                val orientations = mutableListOf(Orientation(part.length, part.width, false))
                if (part.rotate && part.grain.equals("Any", ignoreCase = true) && part.length != part.width) {
                    orientations.add(Orientation(part.width, part.length, true))
                }

                for (rectIdx in sheet.free.indices) {
                    val rect = sheet.free[rectIdx]
                    for (orient in orientations) {
                        for (axis in listOf("vertical", "horizontal")) {
                            val cutRes = split(rect, orient, kerf, axis)
                            if (cutRes != null) {
                                sheet.free.removeAt(rectIdx)
                                sheet.free.addAll(cutRes.children)
                                sheet.placements.add(
                                    PlacedPart(
                                        id = part.id,
                                        name = part.name,
                                        instance = 1,
                                        x = rect.x,
                                        y = rect.y,
                                        w = orient.w,
                                        h = orient.h,
                                        rotated = orient.rotated
                                    )
                                )
                                sheet.cuts.addAll(cutRes.cuts.map { it.copy(sheet = sheet.sheetIndex, partName = part.name) })
                                placed = true
                                break
                            }
                        }
                        if (placed) break
                    }
                    if (placed) break
                }
                if (placed) break
            }

            if (!placed) {
                // Open a new stock sheet
                val stockIdx = availableStock.indexOfFirst { s ->
                    s.material.equals(part.material, ignoreCase = true) &&
                            abs(s.thickness - part.thickness) <= 0.1 &&
                            s.length - 2 * trim >= min(part.length, part.width) &&
                            s.width - 2 * trim >= min(part.length, part.width)
                }

                if (stockIdx != -1) {
                    val stock = availableStock.removeAt(stockIdx)
                    val initialFree = Rect(
                        x = trim,
                        y = trim,
                        w = max(0.0, stock.length - 2 * trim),
                        h = max(0.0, stock.width - 2 * trim)
                    )
                    val newSheet = ActiveSheet(
                        sheetIndex = sheetCounter++,
                        name = stock.name,
                        material = stock.material,
                        length = stock.length,
                        width = stock.width,
                        thickness = stock.thickness,
                        grain = stock.grain,
                        offcut = stock.offcut,
                        free = mutableListOf(initialFree),
                        placements = mutableListOf(),
                        cuts = mutableListOf()
                    )

                    val orientations = mutableListOf(Orientation(part.length, part.width, false))
                    if (part.rotate && part.grain.equals("Any", ignoreCase = true) && part.length != part.width) {
                        orientations.add(Orientation(part.width, part.length, true))
                    }

                    for (orient in orientations) {
                        val cutRes = split(initialFree, orient, kerf, "vertical")
                            ?: split(initialFree, orient, kerf, "horizontal")
                        if (cutRes != null) {
                            newSheet.free.clear()
                            newSheet.free.addAll(cutRes.children)
                            newSheet.placements.add(
                                PlacedPart(
                                    id = part.id,
                                    name = part.name,
                                    instance = 1,
                                    x = initialFree.x,
                                    y = initialFree.y,
                                    w = orient.w,
                                    h = orient.h,
                                    rotated = orient.rotated
                                )
                            )
                            newSheet.cuts.addAll(cutRes.cuts.map { it.copy(sheet = newSheet.sheetIndex, partName = part.name) })
                            placed = true
                            break
                        }
                    }

                    if (placed) {
                        activeSheets.add(newSheet)
                    } else {
                        unplaced.add(part.name)
                    }
                } else {
                    unplaced.add(part.name)
                }
            }
        }

        var globalCutNumber = 1
        val resultSheets = activeSheets.map { sheet ->
            val numberedCuts = sheet.cuts.map { it.copy(number = globalCutNumber++) }
            val offcuts = sheet.free.filter { it.w >= 100 && it.h >= 100 }.mapIndexed { idx, r ->
                SheetOffcut(
                    id = "offcut_${sheet.sheetIndex}_$idx",
                    x = r.x,
                    y = r.y,
                    w = r.w,
                    h = r.h,
                    material = sheet.material,
                    thickness = sheet.thickness,
                    sheet = sheet.sheetIndex
                )
            }
            OptimizedSheet(
                sheetIndex = sheet.sheetIndex,
                name = sheet.name,
                material = sheet.material,
                length = sheet.length,
                width = sheet.width,
                placements = sheet.placements,
                cuts = numberedCuts,
                offcuts = offcuts
            )
        }

        val totalArea = resultSheets.sumOf { it.length * it.width }
        val usedArea = resultSheets.sumOf { s -> s.placements.sumOf { it.w * it.h } }
        val wasteArea = max(0.0, totalArea - usedArea)
        val usedPercent = if (totalArea > 0) ((usedArea / totalArea * 1000.0).roundToInt()) / 10.0 else 0.0
        val wastePercent = if (totalArea > 0) ((wasteArea / totalArea * 1000.0).roundToInt()) / 10.0 else 0.0

        return CuttingOptimizationResult(
            sheets = resultSheets,
            summary = CuttingSummary(
                totalSheets = resultSheets.size,
                totalPartsPlaced = resultSheets.sumOf { it.placements.size },
                unplacedCount = unplaced.size,
                totalArea = totalArea,
                usedArea = usedArea,
                wasteArea = wasteArea,
                usedPercent = usedPercent,
                wastePercent = wastePercent,
                totalCuts = globalCutNumber - 1
            ),
            unplacedParts = unplaced
        )
    }
}
