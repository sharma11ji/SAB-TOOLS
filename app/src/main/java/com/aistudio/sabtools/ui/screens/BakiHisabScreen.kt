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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.sabtools.data.ReceiptRepository
import com.aistudio.sabtools.data.TimberReceiptEntity
import com.aistudio.sabtools.logic.PaymentLedger
import com.aistudio.sabtools.ui.theme.TimberBackground
import com.aistudio.sabtools.ui.theme.TimberDark
import com.aistudio.sabtools.ui.theme.TimberGold
import com.aistudio.sabtools.ui.theme.TimberGoldLight
import com.aistudio.sabtools.ui.theme.TimberOutline
import com.aistudio.sabtools.ui.theme.TimberPrimary
import com.aistudio.sabtools.ui.theme.TimberSuccess
import com.aistudio.sabtools.ui.theme.TimberSuccessContainer
import com.aistudio.sabtools.ui.theme.TimberSurface
import com.aistudio.sabtools.ui.theme.TimberTextSecondary
import kotlinx.coroutines.launch
import java.time.LocalDate

@Composable
fun BakiHisabScreen(
    repository: ReceiptRepository,
    onBack: () -> Unit
) {
    val receipts by repository.allTimberReceipts.collectAsState(initial = emptyList())
    var showPaidHistory by remember { mutableStateOf(false) }

    var selectedReceipt by remember { mutableStateOf<TimberReceiptEntity?>(null) }
    var isPartialPayment by remember { mutableStateOf(false) }
    var paymentAmountInput by remember { mutableStateOf("") }
    var feedbackMessage by remember { mutableStateOf("") }

    val scope = rememberCoroutineScope()

    val pendingList = receipts.filter { it.balance > 0.01 }
    val paidList = receipts.filter { it.balance <= 0.01 }
    val activeList = if (showPaidHistory) paidList else pendingList

    val totalPending = pendingList.sumOf { it.balance }

    fun processPayment(receipt: TimberReceiptEntity, receivedAmount: Double) {
        val newAdvance = receipt.advance + receivedAmount
        val newBalance = Math.max(0.0, receipt.total - newAdvance)
        val newStatus = if (newBalance <= 0.01) "paid" else "pending"

        val updated = receipt.copy(
            advance = newAdvance,
            balance = newBalance,
            status = newStatus,
            lastPaymentAt = LocalDate.now().toString()
        )

        scope.launch {
            repository.updateTimberReceipt(updated)
            feedbackMessage = "${receipt.customerName}: ${PaymentLedger.formatCurrency(receivedAmount)} recorded.${if (newBalance > 0.01) " Remaining: ${PaymentLedger.formatCurrency(newBalance)}" else " Receipt is now fully paid!"}"
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(TimberBackground)
            .padding(16.dp)
            .testTag("baki_hisab_screen")
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
                    text = "Baki hisab",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Total Pending Banner
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("baki_total_card"),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = TimberDark)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "TOTAL PENDING · ${pendingList.size} ${if (pendingList.size == 1) "receipt" else "receipts"}",
                        style = MaterialTheme.typography.labelSmall,
                        color = TimberGold,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = PaymentLedger.formatCurrency(totalPending),
                        style = MaterialTheme.typography.headlineLarge,
                        color = TimberSurface,
                        fontWeight = FontWeight.Black
                    )
                }
            }

            if (feedbackMessage.isNotBlank()) {
                Spacer(modifier = Modifier.height(10.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(containerColor = TimberSuccessContainer)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = TimberSuccess,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = feedbackMessage,
                            style = MaterialTheme.typography.bodySmall,
                            color = TimberSuccess,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Tab switch: Pending vs Paid
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(TimberSurface)
                    .border(1.dp, TimberOutline, RoundedCornerShape(12.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (!showPaidHistory) TimberDark else TimberSurface)
                        .clickable { showPaidHistory = false }
                        .padding(vertical = 10.dp)
                        .testTag("tab_pending"),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Pending (${pendingList.size})",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = if (!showPaidHistory) FontWeight.Bold else FontWeight.Normal,
                        color = if (!showPaidHistory) TimberSurface else MaterialTheme.colorScheme.onSurface
                    )
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (showPaidHistory) TimberDark else TimberSurface)
                        .clickable { showPaidHistory = true }
                        .padding(vertical = 10.dp)
                        .testTag("tab_paid"),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Paid (${paidList.size})",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = if (showPaidHistory) FontWeight.Bold else FontWeight.Normal,
                        color = if (showPaidHistory) TimberSurface else MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            if (activeList.isEmpty()) {
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
                            text = if (showPaidHistory) "No paid receipts yet." else "No pending payments! All timber receipts are paid.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TimberTextSecondary
                        )
                    }
                }
            }
        }

        items(activeList, key = { it.id }) { receipt ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp)
                    .testTag("baki_card_${receipt.id}"),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = TimberSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column {
                            Text(
                                text = receipt.customerName,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Receipt #${receipt.number} · ${receipt.date}${if (receipt.village.isNotBlank()) " · ${receipt.village}" else ""}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TimberTextSecondary
                            )
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(99.dp))
                                .background(if (receipt.balance <= 0.01) TimberSuccessContainer else TimberGoldLight)
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = if (receipt.balance <= 0.01) "Paid" else "Pending",
                                style = MaterialTheme.typography.labelSmall,
                                color = if (receipt.balance <= 0.01) TimberSuccess else TimberPrimary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = if (showPaidHistory) "Paid amount" else "Pending balance",
                                style = MaterialTheme.typography.bodySmall,
                                color = TimberTextSecondary
                            )
                            Text(
                                text = PaymentLedger.formatCurrency(if (showPaidHistory) receipt.advance else receipt.balance),
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Black,
                                color = if (showPaidHistory) TimberSuccess else TimberPrimary
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "Total ${PaymentLedger.formatCurrency(receipt.total)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TimberTextSecondary
                            )
                            Text(
                                text = "Paid ${PaymentLedger.formatCurrency(receipt.advance)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TimberTextSecondary
                            )
                        }
                    }

                    if (!showPaidHistory) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    selectedReceipt = receipt
                                    isPartialPayment = false
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("btn_mark_paid_${receipt.id}"),
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = TimberPrimary)
                            ) {
                                Text("Mark Paid", fontWeight = FontWeight.Bold)
                            }

                            OutlinedButton(
                                onClick = {
                                    selectedReceipt = receipt
                                    isPartialPayment = true
                                    paymentAmountInput = ""
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("btn_part_payment_${receipt.id}"),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Part Payment", color = TimberPrimary, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }
        }
    }

    // Payment Dialog
    val currentReceipt = selectedReceipt
    if (currentReceipt != null) {
        AlertDialog(
            onDismissRequest = { selectedReceipt = null },
            title = {
                Text(if (isPartialPayment) "Record Part Payment" else "Mark Receipt Paid?")
            },
            text = {
                Column {
                    Text(
                        text = "${currentReceipt.customerName} · Receipt #${currentReceipt.number}",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Current pending balance: ${PaymentLedger.formatCurrency(currentReceipt.balance)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TimberPrimary
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    if (isPartialPayment) {
                        OutlinedTextField(
                            value = paymentAmountInput,
                            onValueChange = { paymentAmountInput = it },
                            label = { Text("Amount received now (₹)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("input_baki_part_amount"),
                            shape = RoundedCornerShape(10.dp)
                        )
                    } else {
                        Text(
                            text = "Confirm that full payment of ${PaymentLedger.formatCurrency(currentReceipt.balance)} has been received. This will move the receipt to Paid history.",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amount = if (isPartialPayment) {
                            paymentAmountInput.toDoubleOrNull() ?: 0.0
                        } else {
                            currentReceipt.balance
                        }
                        if (amount > 0) {
                            processPayment(currentReceipt, amount)
                        }
                        selectedReceipt = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = TimberPrimary),
                    modifier = Modifier.testTag("btn_confirm_baki_payment")
                ) {
                    Text("Confirm Payment")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedReceipt = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}
