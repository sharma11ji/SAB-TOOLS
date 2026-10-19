package com.aistudio.sabtools.logic

import com.aistudio.sabtools.model.MeasurementSystem
import com.aistudio.sabtools.model.RoundLogRow
import com.aistudio.sabtools.model.RoundRowTotals
import com.aistudio.sabtools.model.WoodKind
import com.aistudio.sabtools.model.WoodResult
import kotlin.math.pow
import kotlin.math.roundToInt

object WoodCalculations {
    const val CBM_TO_CFT = 35.3147

    /**
     * Quarter-Girth formula: length * girth * girth / 2304
     * Length in feet, Girth is circumference in inches.
     */
    fun roundLogCft(length: Double, girth: Double): Double? {
        if (!length.isFinite() || !girth.isFinite() || length <= 0 || girth <= 0) return null
        val volume = length * girth * girth / 2304.0
        return if (volume.isFinite() && volume > 0) volume else null
    }

    fun calculateWood(
        kind: WoodKind,
        system: MeasurementSystem,
        length: Double,
        widthOrGirth: Double,
        thickness: Double = 0.0,
        pieces: Int,
        rate: Double
    ): WoodResult? {
        if (length <= 0 || widthOrGirth <= 0 || pieces <= 0 || rate < 0) return null
        if (kind == WoodKind.SIZE && thickness <= 0) return null

        val metric = system == MeasurementSystem.METRIC
        val perPiece: Double = when (kind) {
            WoodKind.SIZE -> {
                if (metric) {
                    length * (widthOrGirth / 100.0) * (thickness / 100.0)
                } else {
                    length * widthOrGirth * thickness / 144.0
                }
            }
            WoodKind.DOOR -> {
                length * widthOrGirth
            }
            WoodKind.ROUND -> {
                if (metric) {
                    length * (widthOrGirth / 400.0).pow(2.0)
                } else {
                    roundLogCft(length, widthOrGirth) ?: return null
                }
            }
        }

        val quantity = perPiece * pieces
        val amount = ((quantity * rate * 100.0).roundToInt()) / 100.0
        val unit = when (kind) {
            WoodKind.DOOR -> if (metric) "sq m" else "sq ft"
            else -> if (metric) "CBM" else "CFT"
        }

        return WoodResult(
            perPiece = perPiece,
            quantity = quantity,
            amount = amount,
            unit = unit
        )
    }

    fun calculateRoundRowTotals(
        rows: List<RoundLogRow>,
        system: MeasurementSystem,
        rate: Double?
    ): RoundRowTotals {
        val metric = system == MeasurementSystem.METRIC
        val volumes = rows.map { row ->
            if (metric) {
                row.length * (row.girth / 400.0).pow(2.0) * row.pieces
            } else {
                (roundLogCft(row.length, row.girth) ?: 0.0) * row.pieces
            }
        }
        val totalPieces = rows.sumOf { it.pieces }
        val totalVolume = volumes.sum()
        val unit = if (metric) "CBM" else "CFT"

        val hasPrice = rate != null && rate >= 0
        val amount = if (hasPrice && rate != null) {
            ((totalVolume * rate * 100.0).roundToInt()) / 100.0
        } else null

        return RoundRowTotals(
            valid = rows.isNotEmpty() && volumes.all { it > 0 },
            volumes = volumes,
            pieces = totalPieces,
            volume = totalVolume,
            unit = unit,
            hasPrice = hasPrice,
            amount = amount
        )
    }
}
