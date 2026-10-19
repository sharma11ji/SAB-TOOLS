package com.aistudio.sabtools.ui.navigation

import com.aistudio.sabtools.model.MeasurementSystem
import com.aistudio.sabtools.model.WoodKind

sealed class NavScreen(val title: String) {
    object Home : NavScreen("Home")
    data class SingleWood(val kind: WoodKind, val system: MeasurementSystem) : NavScreen("Wood Calculator")
    data class RoundMulti(val system: MeasurementSystem) : NavScreen("Round Wood")
    object TimberReceipt : NavScreen("Timber Receipt")
    object CuttingOptimizer : NavScreen("Cutting Optimizer")
    object BakiHisab : NavScreen("Baki Hisab")
    object Customers : NavScreen("Customer List")
    object SalesReport : NavScreen("Sale Report")
    object SavedReceipts : NavScreen("Saved Receipts")
    object BubbleLevel : NavScreen("Bubble Level")
    object StoreProfile : NavScreen("Store Profile")
    object UserManual : NavScreen("User Manual")
}
