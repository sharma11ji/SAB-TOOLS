package com.aistudio.sabtools.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Forest
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.sabtools.data.ReceiptRepository
import com.aistudio.sabtools.data.RoundReceiptEntity
import com.aistudio.sabtools.data.TimberReceiptEntity
import com.aistudio.sabtools.logic.PaymentLedger
import com.aistudio.sabtools.ui.theme.TimberBackground
import com.aistudio.sabtools.ui.theme.TimberGold
import com.aistudio.sabtools.ui.theme.TimberGoldLight
import com.aistudio.sabtools.ui.theme.TimberOutline
import com.aistudio.sabtools.ui.theme.TimberPrimary
import com.aistudio.sabtools.ui.theme.TimberSuccess
import com.aistudio.sabtools.ui.theme.TimberSurface
import com.aistudio.sabtools.ui.theme.TimberTextSecondary
import kotlinx.coroutines.launch
import java.util.Locale

@Composable
fun SavedReceiptsScreen(
    repository: ReceiptRepository,
    onBack: () -> Unit
) {
    val timberReceipts by repository.allTimberReceipts.collectAsState(initial = emptyList())
    val roundReceipts by repository.allRoundReceipts.collectAsState(initial = emptyList())

    var filterType by remember { mutableStateOf("all") } // "all", "timber", "round"
    var selectedTimberReceipt by remember { mutableStateOf<TimberReceiptEntity?>(null) }
    var selectedRoundReceipt by remember { mutableStateOf<RoundReceiptEntity?>(null) }

    val scope = rememberCoroutineScope()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(TimberBackground)
            .padding(16.dp)
            .testTag("saved_receipts_screen")
    ) {
        item {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                IconButton(onClick = onBack, modifier = Modifier.testTag("btn_back")) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = TimberPrimary
                    )
                }
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Saved Receipts",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Filter Tabs
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(TimberSurface)
                    .border(1.dp, TimberOutline, RoundedCornerShape(12.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                listOf(
                    Pair("all", "All (${timberReceipts.size + roundReceipts.size})"),
                    Pair("timber", "Timber (${timberReceipts.size})"),
                    Pair("round", "Round (${roundReceipts.size})")
                ).forEach { (id, label) ->
                    val isSelected = filterType == id
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isSelected) TimberPrimary else TimberSurface)
                            .clickable { filterType = id }
                            .padding(vertical = 8.dp)
                            .testTag("tab_filter_$id"),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) TimberSurface else MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            if (timberReceipts.isEmpty() && roundReceipts.isEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = TimberSurface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "No saved receipts yet.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TimberTextSecondary
                        )
                    }
                }
            }
        }

        // Timber Receipts
        if (filterType == "all" || filterType == "timber") {
            items(timberReceipts, key = { "timber_${it.id}" }) { receipt ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 5.dp)
                        .clickable { selectedTimberReceipt = receipt }
                        .testTag("saved_timber_card_${receipt.id}"),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = TimberSurface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(TimberGoldLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Receipt,
                                    contentDescription = null,
                                    tint = TimberPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "Receipt #${receipt.number} · ${receipt.customerName}",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${receipt.date} · ${String.format(Locale.US, "%.3f", receipt.volume)} ${receipt.unit}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TimberTextSecondary
                                )
                            }
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = PaymentLedger.formatCurrency(receipt.total),
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = TimberPrimary
                            )
                            Text(
                                text = if (receipt.balance <= 0.01) "PAID" else "DUE: ${PaymentLedger.formatCurrency(receipt.balance)}",
                                style = MaterialTheme.typography.labelSmall,
                                color = if (receipt.balance <= 0.01) TimberSuccess else TimberGold,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // Round Wood Receipts
        if (filterType == "all" || filterType == "round") {
            items(roundReceipts, key = { "round_${it.id}" }) { receipt ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 5.dp)
                        .clickable { selectedRoundReceipt = receipt }
                        .testTag("saved_round_card_${receipt.id}"),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = TimberSurface),
                    border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(TimberGoldLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Forest,
                                    contentDescription = null,
                                    tint = TimberPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "Round Wood · ${receipt.customerName.ifBlank { "Snapshot" }}",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${receipt.date} · ${receipt.pieces} logs · ${String.format(Locale.US, "%.3f", receipt.volume)} ${receipt.unit}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TimberTextSecondary
                                )
                            }
                        }

                        if (receipt.amount != null) {
                            Text(
                                text = PaymentLedger.formatCurrency(receipt.amount),
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = TimberPrimary
                            )
                        }
                    }
                }
            }
        }
    }

    // Timber Receipt Details Dialog
    val tReceipt = selectedTimberReceipt
    if (tReceipt != null) {
        AlertDialog(
            onDismissRequest = { selectedTimberReceipt = null },
            title = {
                Text("Receipt #${tReceipt.number} · ${tReceipt.customerName}")
            },
            text = {
                Column {
                    Text("Date: ${tReceipt.date}")
                    if (tReceipt.village.isNotBlank()) Text("Village: ${tReceipt.village}")
                    if (tReceipt.customerMobile.isNotBlank()) Text("Mobile: ${tReceipt.customerMobile}")
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Wood Volume: ${String.format(Locale.US, "%.3f", tReceipt.volume)} ${tReceipt.unit} (${String.format(Locale.US, "%.2f", tReceipt.cft)} CFT)")
                    Text("Wood Value: ${PaymentLedger.formatCurrency(tReceipt.woodValue)}")
                    if (tReceipt.labour > 0) Text("Labour Charges: ${PaymentLedger.formatCurrency(tReceipt.labour)}")
                    if (tReceipt.transport > 0) Text("Transport: ${PaymentLedger.formatCurrency(tReceipt.transport)}")
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Grand Total: ${PaymentLedger.formatCurrency(tReceipt.total)}", fontWeight = FontWeight.Bold, color = TimberPrimary)
                    Text("Advance Paid: ${PaymentLedger.formatCurrency(tReceipt.advance)}")
                    Text("Balance Due: ${PaymentLedger.formatCurrency(tReceipt.balance)}", fontWeight = FontWeight.Bold, color = if (tReceipt.balance <= 0.01) TimberSuccess else TimberGold)
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedTimberReceipt = null }) {
                    Text("Close")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        scope.launch {
                            repository.deleteTimberReceipt(tReceipt.id)
                        }
                        selectedTimberReceipt = null
                    }
                ) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            }
        )
    }

    // Round Wood Receipt Details Dialog
    val rReceipt = selectedRoundReceipt
    if (rReceipt != null) {
        AlertDialog(
            onDismissRequest = { selectedRoundReceipt = null },
            title = {
                Text("Round Wood · ${rReceipt.customerName.ifBlank { "Snapshot" }}")
            },
            text = {
                Column {
                    Text("Date: ${rReceipt.date}")
                    if (rReceipt.customerPhone.isNotBlank()) Text("Phone: ${rReceipt.customerPhone}")
                    if (rReceipt.customerAddress.isNotBlank()) Text("Address: ${rReceipt.customerAddress}")
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Total Logs: ${rReceipt.pieces} pieces")
                    Text("Total Volume: ${String.format(Locale.US, "%.3f", rReceipt.volume)} ${rReceipt.unit}")
                    if (rReceipt.rate != null) Text("Rate: ₹${rReceipt.rate} / ${rReceipt.unit}")
                    if (rReceipt.amount != null) Text("Total Amount: ${PaymentLedger.formatCurrency(rReceipt.amount)}", fontWeight = FontWeight.Bold, color = TimberPrimary)
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedRoundReceipt = null }) {
                    Text("Close")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        scope.launch {
                            repository.deleteRoundReceipt(rReceipt.id)
                        }
                        selectedRoundReceipt = null
                    }
                ) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            }
        )
    }
}
