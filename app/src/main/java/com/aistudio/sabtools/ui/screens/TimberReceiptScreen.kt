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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
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
import com.aistudio.sabtools.model.StoreProfileData
import com.aistudio.sabtools.model.TimberRowItem
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
import java.util.Locale
import java.util.UUID

@Composable
fun TimberReceiptScreen(
    repository: ReceiptRepository,
    storeProfile: StoreProfileData,
    onBack: () -> Unit
) {
    var receiptNumber by remember { mutableStateOf("1") }
    var receiptDate by remember { mutableStateOf(LocalDate.now().toString()) }

    var customerName by remember { mutableStateOf("") }
    var customerMobile by remember { mutableStateOf("") }
    var village by remember { mutableStateOf("") }

    var unit by remember { mutableStateOf("CFT") }
    var defaultRateStr by remember { mutableStateOf("0") }
    var advanceStr by remember { mutableStateOf("0") }
    var labourStr by remember { mutableStateOf("0") }
    var transportStr by remember { mutableStateOf("0") }

    val rows = remember {
        mutableStateListOf(
            TimberRowItem(
                id = UUID.randomUUID().toString(),
                wood = "Teak",
                length = 10.0,
                girth = 36.0,
                rate = 0.0
            )
        )
    }

    var showPaymentDialog by remember { mutableStateOf(false) }
    var paymentChoice by remember { mutableStateOf("paid") } // "paid" or "pending"
    var paidNowAmount by remember { mutableStateOf("") }
    var feedbackMessage by remember { mutableStateOf("") }

    val scope = rememberCoroutineScope()

    val defaultRate = defaultRateStr.toDoubleOrNull() ?: 0.0
    val advance = advanceStr.toDoubleOrNull() ?: 0.0
    val labour = labourStr.toDoubleOrNull() ?: 0.0
    val transport = transportStr.toDoubleOrNull() ?: 0.0

    val totals = PaymentLedger.calculateTimberTotals(
        rows = rows,
        defaultRate = defaultRate,
        advance = advance,
        labour = labour,
        transport = transport,
        unit = unit
    )

    fun saveReceipt(finalAdvance: Double, finalStatus: String) {
        val finalBalance = Math.max(0.0, totals.total - finalAdvance)
        val entity = TimberReceiptEntity(
            id = UUID.randomUUID().toString(),
            number = receiptNumber,
            date = receiptDate,
            customerName = customerName.ifBlank { "Customer" },
            customerMobile = customerMobile,
            village = village,
            shopName = storeProfile.storeName.ifBlank { "Timber Shop" },
            shopAddress = storeProfile.address,
            shopMobile = storeProfile.mobile,
            unit = unit,
            defaultRate = defaultRate,
            advance = finalAdvance,
            labour = labour,
            transport = transport,
            cft = totals.cft,
            volume = totals.volume,
            woodValue = totals.woodValue,
            total = totals.total,
            balance = finalBalance,
            status = finalStatus,
            rawRowsJson = rows.joinToString(";") { "${it.wood},${it.length},${it.girth},${it.rate}" }
        )

        scope.launch {
            repository.saveTimberReceipt(entity)
            feedbackMessage = "Receipt #${receiptNumber} saved for ${entity.customerName}! (${finalStatus.uppercase()})"
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(TimberBackground)
            .padding(16.dp)
            .testTag("timber_receipt_screen")
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
                    text = "Timber Receipt",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Shop Header Summary
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = TimberDark)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = if (storeProfile.storeName.isNotBlank()) storeProfile.storeName else "TIMBER SAW MILL & FURNITURE",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TimberGold
                    )
                    if (storeProfile.address.isNotBlank()) {
                        Text(
                            text = storeProfile.address,
                            style = MaterialTheme.typography.bodySmall,
                            color = TimberSurface.copy(alpha = 0.8f)
                        )
                    }
                    if (storeProfile.mobile.isNotBlank()) {
                        Text(
                            text = "Mob: ${storeProfile.mobile}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TimberSurface.copy(alpha = 0.8f)
                        )
                    }
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

            // Customer Details Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = TimberSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "Receipt & Customer Details",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = receiptNumber,
                            onValueChange = { receiptNumber = it },
                            label = { Text("Receipt #") },
                            modifier = Modifier
                                .weight(1f)
                                .testTag("input_receipt_number"),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )

                        OutlinedTextField(
                            value = receiptDate,
                            onValueChange = { receiptDate = it },
                            label = { Text("Date (YYYY-MM-DD)") },
                            modifier = Modifier
                                .weight(1.3f)
                                .testTag("input_receipt_date"),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = customerName,
                        onValueChange = { customerName = it },
                        label = { Text("Customer Name") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_receipt_customer_name"),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = TimberGold,
                            unfocusedBorderColor = TimberOutline
                        )
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = customerMobile,
                            onValueChange = { customerMobile = it },
                            label = { Text("Customer Mobile") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("input_receipt_customer_mobile"),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )

                        OutlinedTextField(
                            value = village,
                            onValueChange = { village = it },
                            label = { Text("Village / Address") },
                            modifier = Modifier
                                .weight(1f)
                                .testTag("input_receipt_customer_village"),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Wood Unit and Rates
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(TimberSurface)
                        .border(1.dp, TimberOutline, RoundedCornerShape(10.dp))
                        .padding(4.dp)
                ) {
                    listOf("CFT", "CBM").forEach { u ->
                        val selected = unit == u
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (selected) TimberDark else TimberSurface)
                                .clickable { unit = u }
                                .padding(horizontal = 14.dp, vertical = 8.dp)
                                .testTag("btn_unit_$u"),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = u,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                color = if (selected) TimberSurface else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = defaultRateStr,
                    onValueChange = { defaultRateStr = it },
                    label = { Text("Rate per $unit (₹)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("input_receipt_default_rate"),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TimberGold,
                        unfocusedBorderColor = TimberOutline
                    )
                )
            }

            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Timber Items (${rows.size})",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Button(
                    onClick = {
                        rows.add(
                            TimberRowItem(
                                id = UUID.randomUUID().toString(),
                                wood = "",
                                length = 8.0,
                                girth = 24.0,
                                rate = 0.0
                            )
                        )
                    },
                    modifier = Modifier.testTag("btn_add_receipt_row"),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TimberPrimary)
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add Line", fontSize = 12.sp)
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
        }

        // Table Rows
        itemsIndexed(rows) { index, item ->
            val vol = totals.volumes.getOrNull(index) ?: 0.0
            val amt = totals.amounts.getOrNull(index) ?: 0.0

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = TimberSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline.copy(alpha = 0.6f))
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Line #${index + 1}",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = TimberPrimary
                        )

                        Text(
                            text = String.format(Locale.US, "%.3f %s · %s", vol, unit, PaymentLedger.formatCurrency(amt)),
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = TimberGold
                        )

                        if (rows.size > 1) {
                            IconButton(
                                onClick = { rows.removeAt(index) },
                                modifier = Modifier.size(28.dp).testTag("btn_delete_receipt_row_$index")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "Delete line",
                                    tint = MaterialTheme.colorScheme.error,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        OutlinedTextField(
                            value = item.wood,
                            onValueChange = { rows[index] = item.copy(wood = it) },
                            placeholder = { Text("Wood/Desc") },
                            modifier = Modifier.weight(1.3f),
                            shape = RoundedCornerShape(8.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )

                        OutlinedTextField(
                            value = if (item.length > 0) item.length.toString() else "",
                            onValueChange = { rows[index] = item.copy(length = it.toDoubleOrNull() ?: 0.0) },
                            placeholder = { Text("L(ft)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )

                        OutlinedTextField(
                            value = if (item.girth > 0) item.girth.toString() else "",
                            onValueChange = { rows[index] = item.copy(girth = it.toDoubleOrNull() ?: 0.0) },
                            placeholder = { Text("G(in)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(14.dp))

            // Charges & Payment Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = TimberSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "Additional Charges & Advance",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = labourStr,
                            onValueChange = { labourStr = it },
                            label = { Text("Labour (₹)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("input_receipt_labour"),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )

                        OutlinedTextField(
                            value = transportStr,
                            onValueChange = { transportStr = it },
                            label = { Text("Transport (₹)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("input_receipt_transport"),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )

                        OutlinedTextField(
                            value = advanceStr,
                            onValueChange = { advanceStr = it },
                            label = { Text("Advance (₹)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("input_receipt_advance"),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Billing Totals Summary Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("receipt_totals_card"),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = TimberDark)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Wood Volume", color = TimberSurface.copy(alpha = 0.8f))
                        Text(
                            String.format(Locale.US, "%.3f %s (%.2f CFT)", totals.volume, unit, totals.cft),
                            color = TimberSurface,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Wood Value", color = TimberSurface.copy(alpha = 0.8f))
                        Text(PaymentLedger.formatCurrency(totals.woodValue), color = TimberSurface, fontWeight = FontWeight.Bold)
                    }

                    if (totals.labour > 0 || totals.transport > 0) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Labour + Transport", color = TimberSurface.copy(alpha = 0.8f))
                            Text(PaymentLedger.formatCurrency(totals.labour + totals.transport), color = TimberSurface)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(TimberOutline.copy(alpha = 0.3f)))
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("GRAND TOTAL", color = TimberGold, fontWeight = FontWeight.Black, fontSize = 16.sp)
                        Text(PaymentLedger.formatCurrency(totals.total), color = TimberGold, fontWeight = FontWeight.Black, fontSize = 18.sp)
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Advance / Paid", color = TimberSurface.copy(alpha = 0.8f))
                        Text(PaymentLedger.formatCurrency(totals.advance), color = TimberSurface, fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Balance Due", color = if (totals.balance > 0) TimberGoldLight else TimberSuccess, fontWeight = FontWeight.Bold)
                        Text(
                            PaymentLedger.formatCurrency(totals.balance),
                            color = if (totals.balance > 0) TimberGoldLight else TimberSuccess,
                            fontWeight = FontWeight.Black,
                            fontSize = 16.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    paidNowAmount = advanceStr
                    showPaymentDialog = true
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("btn_save_receipt"),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = TimberPrimary)
            ) {
                Icon(imageVector = Icons.Default.Save, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Save Receipt & Payment", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    // Payment Dialog for choosing Paid vs Pending
    if (showPaymentDialog) {
        AlertDialog(
            onDismissRequest = { showPaymentDialog = false },
            title = {
                Text("Save Receipt · Payment Status", fontWeight = FontWeight.Bold)
            },
            text = {
                Column {
                    Text(
                        text = "Receipt Total: ${PaymentLedger.formatCurrency(totals.total)}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TimberPrimary
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { paymentChoice = "paid" }
                    ) {
                        RadioButton(
                            selected = paymentChoice == "paid",
                            onClick = { paymentChoice = "paid" },
                            colors = RadioButtonDefaults.colors(selectedColor = TimberPrimary)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text("Full Payment Received (Paid)", fontWeight = FontWeight.Bold)
                            Text("Customer paid full amount of ${PaymentLedger.formatCurrency(totals.total)}", style = MaterialTheme.typography.bodySmall, color = TimberTextSecondary)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { paymentChoice = "pending" }
                    ) {
                        RadioButton(
                            selected = paymentChoice == "pending",
                            onClick = { paymentChoice = "pending" },
                            colors = RadioButtonDefaults.colors(selectedColor = TimberPrimary)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text("Pending / Part Payment (Baki)", fontWeight = FontWeight.Bold)
                            Text("Add to customer's outstanding balance", style = MaterialTheme.typography.bodySmall, color = TimberTextSecondary)
                        }
                    }

                    if (paymentChoice == "pending") {
                        Spacer(modifier = Modifier.height(10.dp))
                        OutlinedTextField(
                            value = paidNowAmount,
                            onValueChange = { paidNowAmount = it },
                            label = { Text("Amount paid now (₹)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("input_paid_now"),
                            shape = RoundedCornerShape(10.dp)
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val finalAdvance = if (paymentChoice == "paid") {
                            totals.total
                        } else {
                            paidNowAmount.toDoubleOrNull() ?: advance
                        }
                        val finalStatus = if (finalAdvance >= totals.total) "paid" else "pending"
                        saveReceipt(finalAdvance, finalStatus)
                        showPaymentDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = TimberPrimary),
                    modifier = Modifier.testTag("btn_confirm_save_receipt")
                ) {
                    Text("Confirm & Save", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showPaymentDialog = false }) {
                    Text("Cancel", color = TimberPrimary)
                }
            }
        )
    }
}
