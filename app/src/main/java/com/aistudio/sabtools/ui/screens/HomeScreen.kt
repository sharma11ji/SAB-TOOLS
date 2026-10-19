package com.aistudio.sabtools.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.DoorBack
import androidx.compose.material.icons.filled.Forest
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Store
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.ViewInAr
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.sabtools.model.MeasurementSystem
import com.aistudio.sabtools.model.StoreProfileData
import com.aistudio.sabtools.model.WoodKind
import com.aistudio.sabtools.ui.navigation.NavScreen
import com.aistudio.sabtools.ui.theme.TimberBackground
import com.aistudio.sabtools.ui.theme.TimberGoldLight
import com.aistudio.sabtools.ui.theme.TimberOutline
import com.aistudio.sabtools.ui.theme.TimberPrimary
import com.aistudio.sabtools.ui.theme.TimberSurface
import com.aistudio.sabtools.ui.theme.TimberSurfaceVariant
import com.aistudio.sabtools.ui.theme.TimberTextSecondary

data class CalculatorCardItem(
    val kind: WoodKind,
    val system: MeasurementSystem,
    val title: String,
    val unitSubtitle: String,
    val description: String,
    val dimensionBadge: String,
    val icon: ImageVector
)

data class BusinessToolItem(
    val category: String,
    val badge: String,
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    val screen: NavScreen,
    val tag: String
)

@Composable
fun HomeScreen(
    storeProfile: StoreProfileData,
    onNavigate: (NavScreen) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("All Suite") }

    val filters = listOf("All Suite", "Wood Calculators", "Billing & Ledger", "Workshop & Nesting")

    val calculators = listOf(
        CalculatorCardItem(
            kind = WoodKind.ROUND,
            system = MeasurementSystem.IMPERIAL,
            title = "Round wood",
            unitSubtitle = "Foot, Inch",
            description = "Quarter-girth 2304 cubic foot log volume & batch pricing",
            dimensionBadge = "F³",
            icon = Icons.Default.Forest
        ),
        CalculatorCardItem(
            kind = WoodKind.SIZE,
            system = MeasurementSystem.IMPERIAL,
            title = "Size wood",
            unitSubtitle = "Foot, Inch",
            description = "Plank & scantling CFT calculator with piece multiplier",
            dimensionBadge = "F³",
            icon = Icons.Default.ViewInAr
        ),
        CalculatorCardItem(
            kind = WoodKind.ROUND,
            system = MeasurementSystem.METRIC,
            title = "Round wood",
            unitSubtitle = "Meter, cm",
            description = "Metric log cubic meter calculation with cm circumference",
            dimensionBadge = "M³",
            icon = Icons.Default.Forest
        ),
        CalculatorCardItem(
            kind = WoodKind.SIZE,
            system = MeasurementSystem.METRIC,
            title = "Size wood",
            unitSubtitle = "Meter, cm",
            description = "Metric sawn timber volume in CBM with cm cross-section",
            dimensionBadge = "M³",
            icon = Icons.Default.ViewInAr
        ),
        CalculatorCardItem(
            kind = WoodKind.DOOR,
            system = MeasurementSystem.IMPERIAL,
            title = "Flush door",
            unitSubtitle = "Foot, Inch",
            description = "Square footage area & unit pricing for doors and sheets",
            dimensionBadge = "F²",
            icon = Icons.Default.DoorBack
        ),
        CalculatorCardItem(
            kind = WoodKind.DOOR,
            system = MeasurementSystem.METRIC,
            title = "Flush door",
            unitSubtitle = "Meter, cm",
            description = "Metric square meter surface area for panels and doors",
            dimensionBadge = "M²",
            icon = Icons.Default.DoorBack
        )
    )

    val businessTools = listOf(
        BusinessToolItem(
            category = "Billing & Ledger",
            badge = "INV",
            title = "Timber receipt",
            subtitle = "Create & print customer billing receipt",
            icon = Icons.Default.Receipt,
            screen = NavScreen.TimberReceipt,
            tag = "btn_nav_timber_receipt"
        ),
        BusinessToolItem(
            category = "Billing & Ledger",
            badge = "₹",
            title = "Baki hisab",
            subtitle = "Track pending customer dues & payments",
            icon = Icons.Default.AccountBalanceWallet,
            screen = NavScreen.BakiHisab,
            tag = "btn_nav_baki_hisab"
        ),
        BusinessToolItem(
            category = "Billing & Ledger",
            badge = "DIR",
            title = "Customer list",
            subtitle = "Customer phone directory & balances",
            icon = Icons.Default.People,
            screen = NavScreen.Customers,
            tag = "btn_nav_customers"
        ),
        BusinessToolItem(
            category = "Billing & Ledger",
            badge = "KPI",
            title = "Sale report",
            subtitle = "Revenue statistics & top buyers",
            icon = Icons.Default.TrendingUp,
            screen = NavScreen.SalesReport,
            tag = "btn_nav_sale_report"
        ),
        BusinessToolItem(
            category = "Billing & Ledger",
            badge = "DOC",
            title = "Saved receipts",
            subtitle = "Browse saved bills & log snapshots",
            icon = Icons.Default.Description,
            screen = NavScreen.SavedReceipts,
            tag = "btn_nav_saved_receipts"
        ),
        BusinessToolItem(
            category = "Workshop & Nesting",
            badge = "OPT",
            title = "Cutting optimizer",
            subtitle = "Guillotine sheet cut plan generator",
            icon = Icons.Default.ContentCut,
            screen = NavScreen.CuttingOptimizer,
            tag = "btn_nav_cutting_optimizer"
        ),
        BusinessToolItem(
            category = "Workshop & Nesting",
            badge = "0.0°",
            title = "Bubble level",
            subtitle = "Machine & flat surface alignment",
            icon = Icons.Default.Navigation,
            screen = NavScreen.BubbleLevel,
            tag = "btn_nav_bubble_level"
        ),
        BusinessToolItem(
            category = "Workshop & Nesting",
            badge = "REF",
            title = "User manual & formulas",
            subtitle = "Formulas, CFT tables & guides",
            icon = Icons.Default.MenuBook,
            screen = NavScreen.UserManual,
            tag = "btn_nav_manual"
        )
    )

    val q = searchQuery.trim().lowercase()

    val filteredCalculators = calculators.filter { item ->
        val matchesCategory = selectedFilter == "All Suite" || selectedFilter == "Wood Calculators"
        val matchesSearch = q.isEmpty() ||
            item.title.lowercase().contains(q) ||
            item.unitSubtitle.lowercase().contains(q) ||
            item.description.lowercase().contains(q) ||
            item.dimensionBadge.lowercase().contains(q)
        matchesCategory && matchesSearch
    }

    val filteredBusinessTools = businessTools.filter { tool ->
        val matchesCategory = selectedFilter == "All Suite" || selectedFilter == tool.category
        val matchesSearch = q.isEmpty() ||
            tool.title.lowercase().contains(q) ||
            tool.subtitle.lowercase().contains(q) ||
            tool.badge.lowercase().contains(q)
        matchesCategory && matchesSearch
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(TimberBackground)
            .testTag("home_screen"),
        contentPadding = PaddingValues(bottom = 40.dp)
    ) {
        // Minimalist Apple-inspired Centered Hero
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 28.dp)
                    .testTag("hero_shop_card"),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Eyebrow Store Pill
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(TimberSurface)
                        .border(1.dp, TimberOutline, RoundedCornerShape(999.dp))
                        .clickable { onNavigate(NavScreen.StoreProfile) }
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                        .testTag("btn_store_profile_shortcut")
                ) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(TimberPrimary)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (storeProfile.storeName.isNotBlank()) {
                            storeProfile.storeName.uppercase()
                        } else {
                            "PRECISION TIMBER OPERATING SYSTEM"
                        },
                        style = MaterialTheme.typography.labelSmall,
                        color = TimberPrimary,
                        letterSpacing = 1.1.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Icon(
                        imageVector = Icons.Default.Store,
                        contentDescription = "Store profile",
                        tint = TimberTextSecondary,
                        modifier = Modifier.size(13.dp)
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))

                Text(
                    text = "Crafted for modern timber & furniture commerce.",
                    style = MaterialTheme.typography.displaySmall,
                    color = TimberPrimary,
                    textAlign = TextAlign.Center,
                    fontWeight = FontWeight.Black
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Exact Quarter-Girth CFT & CBM measurement, automated sheet nesting, print-ready client billing, and real-time baki ledger—engineered in a clean, distraction-free workspace.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = TimberTextSecondary,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(22.dp))

                // Primary & Secondary Pill CTAs
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(
                        onClick = { onNavigate(NavScreen.TimberReceipt) },
                        shape = RoundedCornerShape(999.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = TimberPrimary,
                            contentColor = TimberSurface
                        ),
                        contentPadding = PaddingValues(horizontal = 22.dp, vertical = 12.dp)
                    ) {
                        Text(
                            text = "New Timber Receipt",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }

                    OutlinedButton(
                        onClick = { onNavigate(NavScreen.CuttingOptimizer) },
                        shape = RoundedCornerShape(999.dp),
                        border = BorderStroke(1.dp, TimberOutline),
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = TimberSurface,
                            contentColor = TimberPrimary
                        ),
                        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp)
                    ) {
                        Text(
                            text = "Cutting Optimizer",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(26.dp))

                // Pill-shaped Search Input
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = {
                        Text(
                            text = "Search calculators, CFT, receipts, baki ledger...",
                            color = TimberTextSecondary,
                            fontSize = 14.sp
                        )
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "Search",
                            tint = TimberTextSecondary
                        )
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Clear search",
                                    tint = TimberPrimary
                                )
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(999.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = TimberSurface,
                        unfocusedContainerColor = TimberSurface,
                        focusedBorderColor = TimberPrimary,
                        unfocusedBorderColor = TimberOutline,
                        focusedTextColor = TimberPrimary,
                        unfocusedTextColor = TimberPrimary
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("search_tools_pill")
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Pill-shaped Filter Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally)
                ) {
                    filters.forEach { filter ->
                        val isSelected = selectedFilter == filter
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .background(if (isSelected) TimberPrimary else TimberSurface)
                                .border(
                                    width = 1.dp,
                                    color = if (isSelected) TimberPrimary else TimberOutline,
                                    shape = RoundedCornerShape(999.dp)
                                )
                                .clickable { selectedFilter = filter }
                                .padding(horizontal = 16.dp, vertical = 9.dp)
                        ) {
                            Text(
                                text = filter,
                                style = MaterialTheme.typography.labelLarge,
                                color = if (isSelected) TimberSurface else TimberPrimary,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }

        // Section: Measurement Engine (Wood Calculators)
        if (filteredCalculators.isNotEmpty()) {
            item {
                Column(modifier = Modifier.padding(horizontal = 18.dp, vertical = 8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        Column {
                            Text(
                                text = "MEASUREMENT ENGINE",
                                style = MaterialTheme.typography.labelSmall,
                                color = TimberTextSecondary,
                                letterSpacing = 1.1.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Your tools",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.ExtraBold,
                                color = TimberPrimary
                            )
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .background(TimberSurfaceVariant)
                                .padding(horizontal = 12.dp, vertical = 5.dp)
                        ) {
                            Text(
                                text = "${filteredCalculators.size} modules",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.SemiBold,
                                color = TimberTextSecondary
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    HorizontalDivider(color = TimberOutline.copy(alpha = 0.6f))
                }
            }

            item {
                Column(
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 6.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    for (chunk in filteredCalculators.chunked(2)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            for (item in chunk) {
                                Card(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable {
                                            if (item.kind == WoodKind.ROUND) {
                                                onNavigate(NavScreen.RoundMulti(item.system))
                                            } else {
                                                onNavigate(NavScreen.SingleWood(item.kind, item.system))
                                            }
                                        }
                                        .testTag("calc_card_${item.kind.name.lowercase()}_${item.system.name.lowercase()}"),
                                    shape = RoundedCornerShape(20.dp),
                                    colors = CardDefaults.cardColors(containerColor = TimberSurface),
                                    border = BorderStroke(1.dp, TimberOutline.copy(alpha = 0.7f)),
                                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(16.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(999.dp))
                                                    .background(TimberGoldLight)
                                                    .border(1.dp, TimberOutline, RoundedCornerShape(999.dp))
                                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                                            ) {
                                                Text(
                                                    text = item.unitSubtitle,
                                                    style = MaterialTheme.typography.labelSmall,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = TimberPrimary
                                                )
                                            }

                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(999.dp))
                                                    .background(TimberPrimary)
                                                    .padding(horizontal = 9.dp, vertical = 3.dp)
                                            ) {
                                                Text(
                                                    text = item.dimensionBadge,
                                                    style = MaterialTheme.typography.labelSmall,
                                                    fontWeight = FontWeight.Bold,
                                                    color = TimberSurface
                                                )
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(14.dp))

                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(54.dp)
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(TimberBackground),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = item.icon,
                                                contentDescription = null,
                                                tint = TimberPrimary,
                                                modifier = Modifier.size(26.dp)
                                            )
                                        }

                                        Spacer(modifier = Modifier.height(12.dp))

                                        Text(
                                            text = item.title,
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.Bold,
                                            color = TimberPrimary
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = item.description,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TimberTextSecondary,
                                            maxLines = 2
                                        )
                                        Spacer(modifier = Modifier.height(12.dp))
                                        HorizontalDivider(color = TimberOutline.copy(alpha = 0.45f))
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = "Launch calculator",
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.SemiBold,
                                                color = TimberPrimary
                                            )
                                            Text(
                                                text = "→",
                                                style = MaterialTheme.typography.labelMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = TimberPrimary
                                            )
                                        }
                                    }
                                }
                            }
                            if (chunk.size == 1) {
                                Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            }
        }

        // Section: Operations & Ledger (Business + Workshop Grid)
        if (filteredBusinessTools.isNotEmpty()) {
            item {
                Spacer(modifier = Modifier.height(22.dp))
                Column(modifier = Modifier.padding(horizontal = 18.dp, vertical = 8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        Column {
                            Text(
                                text = "OPERATIONS & LEDGER",
                                style = MaterialTheme.typography.labelSmall,
                                color = TimberTextSecondary,
                                letterSpacing = 1.1.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Your business",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.ExtraBold,
                                color = TimberPrimary
                            )
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .background(TimberSurfaceVariant)
                                .padding(horizontal = 12.dp, vertical = 5.dp)
                        ) {
                            Text(
                                text = "${filteredBusinessTools.size} modules",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.SemiBold,
                                color = TimberTextSecondary
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    HorizontalDivider(color = TimberOutline.copy(alpha = 0.6f))
                }
            }

            item {
                Column(
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 6.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    for (chunk in filteredBusinessTools.chunked(2)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            for (tool in chunk) {
                                Card(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable { onNavigate(tool.screen) }
                                        .testTag(tool.tag),
                                    shape = RoundedCornerShape(20.dp),
                                    colors = CardDefaults.cardColors(containerColor = TimberSurface),
                                    border = BorderStroke(1.dp, TimberOutline.copy(alpha = 0.7f)),
                                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(16.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(38.dp)
                                                    .clip(CircleShape)
                                                    .background(TimberGoldLight)
                                                    .border(1.dp, TimberOutline, CircleShape),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Icon(
                                                    imageVector = tool.icon,
                                                    contentDescription = null,
                                                    tint = TimberPrimary,
                                                    modifier = Modifier.size(19.dp)
                                                )
                                            }

                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(999.dp))
                                                    .background(TimberGoldLight)
                                                    .border(1.dp, TimberOutline, RoundedCornerShape(999.dp))
                                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                                            ) {
                                                Text(
                                                    text = tool.badge,
                                                    style = MaterialTheme.typography.labelSmall,
                                                    fontWeight = FontWeight.Bold,
                                                    color = TimberPrimary
                                                )
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(14.dp))

                                        Text(
                                            text = tool.title,
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.Bold,
                                            color = TimberPrimary
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = tool.subtitle,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TimberTextSecondary,
                                            maxLines = 2
                                        )
                                        Spacer(modifier = Modifier.height(12.dp))
                                        HorizontalDivider(color = TimberOutline.copy(alpha = 0.45f))
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = "Open workspace",
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.SemiBold,
                                                color = TimberPrimary
                                            )
                                            Text(
                                                text = "→",
                                                style = MaterialTheme.typography.labelMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = TimberPrimary
                                            )
                                        }
                                    }
                                }
                            }
                            if (chunk.size == 1) {
                                Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            }
        }
    }
}
