package com.aistudio.sabtools.model

data class CuttingStock(
    val id: String,
    val name: String,
    val material: String,
    val thickness: Double,
    val length: Double,
    val width: Double,
    val quantity: Int,
    val grain: String = "Any", // "Any", "Horizontal", "Vertical", "Locked"
    val offcut: Boolean = false
)

data class CuttingPart(
    val id: String,
    val name: String,
    val material: String,
    val thickness: Double,
    val length: Double,
    val width: Double,
    val quantity: Int,
    val grain: String = "Any",
    val rotate: Boolean = true
)

data class PlacedPart(
    val id: String,
    val name: String,
    val instance: Int,
    val x: Double,
    val y: Double,
    val w: Double,
    val h: Double,
    val rotated: Boolean
)

data class CutLine(
    val number: Int,
    val axis: String, // "vertical" or "horizontal"
    val x: Double,
    val y: Double,
    val span: Double,
    val distance: Double,
    val partName: String,
    val trim: Boolean = false,
    val sheet: Int = 1
)

data class SheetOffcut(
    val id: String,
    val x: Double,
    val y: Double,
    val w: Double,
    val h: Double,
    val material: String,
    val thickness: Double,
    val sheet: Int
)

data class OptimizedSheet(
    val sheetIndex: Int,
    val name: String,
    val material: String,
    val length: Double,
    val width: Double,
    val placements: List<PlacedPart>,
    val cuts: List<CutLine>,
    val offcuts: List<SheetOffcut>
)

data class CuttingSummary(
    val totalSheets: Int,
    val totalPartsPlaced: Int,
    val unplacedCount: Int,
    val totalArea: Double,
    val usedArea: Double,
    val wasteArea: Double,
    val usedPercent: Double,
    val wastePercent: Double,
    val totalCuts: Int
)

data class CuttingOptimizationResult(
    val sheets: List<OptimizedSheet>,
    val summary: CuttingSummary,
    val unplacedParts: List<String>
)
