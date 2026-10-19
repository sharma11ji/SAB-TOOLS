package com.aistudio.sabtools.model

enum class WoodKind(val title: String) {
    SIZE("Size wood"),
    DOOR("Flush door"),
    ROUND("Round wood")
}

enum class MeasurementSystem(val title: String) {
    IMPERIAL("Foot, Inch"),
    METRIC("Meter, cm")
}

data class WoodResult(
    val perPiece: Double,
    val quantity: Double,
    val amount: Double,
    val unit: String
)

data class RoundLogRow(
    val id: String,
    val length: Double,
    val girth: Double,
    val pieces: Int
)

data class RoundRowTotals(
    val valid: Boolean,
    val volumes: List<Double>,
    val pieces: Int,
    val volume: Double,
    val unit: String,
    val hasPrice: Boolean,
    val amount: Double?
)
