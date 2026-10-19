package com.aistudio.sabtools.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
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
import com.aistudio.sabtools.data.RoundReceiptEntity
import com.aistudio.sabtools.logic.PaymentLedger
import com.aistudio.sabtools.logic.WoodCalculations
import com.aistudio.sabtools.model.MeasurementSystem
import com.aistudio.sabtools.model.RoundLogRow
import com.aistudio.sabtools.model.StoreProfileData
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
fun RoundWoodMultiScreen(
    initialSystem: MeasurementSystem,
    repository: ReceiptRepository,
    storeProfile: StoreProfileData,
    onBack: () -> Unit
) {
    var system by remember { mutableStateOf(initialSystem) }
    val metric = system == MeasurementSystem.METRIC
    val unit = if (metric) "CBM" else "CFT"

    val rows = remember { mutableStateListOf<RoundLogRow>() }

    var lengthInput by remember { mutableStateOf("") }
    var girthInput by remember { mutableStateOf("") }
    var piecesInput by remember { mutableStateOf("1") }
    var rateInput by remember { mutableStateOf("") }

    var customerName by remember { mutableStateOf("") }
    var customerPhone by remember { mutableStateOf("") }
    var customerAddress by remember { mutableStateOf("") }

    var feedbackMessage by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    val rate = rateInput.toDoubleOrNull()
    val totals = WoodCalculations.calculateRoundRowTotals(rows, system, rate)

    fun addRow() {
        val l = lengthInput.toDoubleOrNull() ?: return
        val g = girthInput.toDoubleOrNull() ?: return
        val p = piecesInput.toIntOrNull() ?: 1
        if (l <= 0 || g <= 0 || p <= 0) return

        rows.add(RoundLogRow(id = UUID.randomUUID().toString(), length = l, girth = g, pieces = p))
        lengthInput = ""
        girthInput = ""
        piecesInput = "1"
        feedbackMessage = ""
    }

    fun saveReceiptSnapshot() {
        if (rows.isEmpty()) return
        scope.launch {
            val entity = RoundReceiptEntity(
                id = UUID.randomUUID().toString(),
                date = LocalDate.now().toString(),
                customerName = customerName.trim(),
                customerAddress = customerAddress.trim(),
                customerPhone = customerPhone.trim(),
                storeName = storeProfile.storeName,
                unit = unit,
                pieces = totals.pieces,
                volume = totals.volume,
                rate = rate,
                amount = totals.amount,
                rawRowsJson = rows.joinToString(";") { "${it.length},${it.girth},${it.pieces}" }
            )
            repository.saveRoundReceipt(entity)
            feedbackMessage = "Saved round wood receipt (${totals.pieces} logs, ${String.format(Locale.US, "%.3f", totals.volume)} $unit)!"
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(TimberBackground)
            .padding(16.dp)
            .testTag("round_wood_multi_screen")
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
                    text = "Round Wood",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.width(8.dp))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(TimberGoldLight)
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = if (metric) "Meter (CBM)" else "Foot (CFT)",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = TimberPrimary
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Totals Banner
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("round_totals_card"),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = TimberDark)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "TOTAL LOGS",
                            style = MaterialTheme.typography.labelSmall,
                            color = TimberGold,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${totals.pieces} pcs",
                            style = MaterialTheme.typography.headlineMedium,
                            color = TimberSurface,
                            fontWeight = FontWeight.Black
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "TOTAL VOLUME",
                            style = MaterialTheme.typography.labelSmall,
                            color = TimberGold,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = String.format(Locale.US, "%.3f %s", totals.volume, totals.unit),
                            style = MaterialTheme.typography.headlineMedium,
                            color = TimberSurface,
                            fontWeight = FontWeight.Black
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

            // Add Log Input Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = TimberSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "Add Log Measurement",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = lengthInput,
                            onValueChange = { lengthInput = it },
                            label = { Text("Length (${if (metric) "m" else "ft"})") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("input_log_length"),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )

                        OutlinedTextField(
                            value = girthInput,
                            onValueChange = { girthInput = it },
                            label = { Text("Girth (${if (metric) "cm" else "in"})") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("input_log_girth"),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )

                        OutlinedTextField(
                            value = piecesInput,
                            onValueChange = { piecesInput = it },
                            label = { Text("Qty") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier
                                .weight(0.7f)
                                .testTag("input_log_qty"),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Button(
                        onClick = { addRow() },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("btn_add_log"),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = TimberPrimary)
                    ) {
                        Icon(imageVector = Icons.Default.Add, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add to List", fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
            Text(
                text = "Log Entries (${rows.size})",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(6.dp))
        }

        // Table Rows
        itemsIndexed(rows) { index, row ->
            val vol = if (metric) {
                row.length * (row.girth / 400.0) * (row.girth / 400.0) * row.pieces
            } else {
                (WoodCalculations.roundLogCft(row.length, row.girth) ?: 0.0) * row.pieces
            }

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 3.dp),
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = TimberSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline.copy(alpha = 0.5f))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "#${index + 1}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = TimberPrimary
                    )

                    Column {
                        Text(
                            text = "L: ${row.length} · G: ${row.girth} · ${row.pieces} pcs",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = String.format(Locale.US, "%.3f %s", vol, unit),
                            style = MaterialTheme.typography.bodySmall,
                            color = TimberTextSecondary
                        )
                    }

                    IconButton(
                        onClick = { rows.removeAt(index) },
                        modifier = Modifier.testTag("btn_delete_log_$index")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Delete row",
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(14.dp))

            // Pricing & Customer Details
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = TimberSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "Pricing & Customer Details",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        OutlinedTextField(
                            value = rateInput,
                            onValueChange = { rateInput = it },
                            label = { Text("Rate per $unit (₹)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("input_round_rate"),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = TimberGold,
                                unfocusedBorderColor = TimberOutline
                            )
                        )

                        Spacer(modifier = Modifier.width(12.dp))
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "Total amount",
                                style = MaterialTheme.typography.bodySmall,
                                color = TimberTextSecondary
                            )
                            Text(
                                text = if (totals.amount != null) PaymentLedger.formatCurrency(totals.amount) else "—",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = TimberPrimary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = customerName,
                        onValueChange = { customerName = it },
                        label = { Text("Customer name (optional)") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_round_customer_name"),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = TimberGold,
                            unfocusedBorderColor = TimberOutline
                        )
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = customerPhone,
                        onValueChange = { customerPhone = it },
                        label = { Text("Phone number (optional)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_round_customer_phone"),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = TimberGold,
                            unfocusedBorderColor = TimberOutline
                        )
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = customerAddress,
                        onValueChange = { customerAddress = it },
                        label = { Text("Address / Village (optional)") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_round_customer_address"),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = TimberGold,
                            unfocusedBorderColor = TimberOutline
                        )
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = { saveReceiptSnapshot() },
                        enabled = rows.isNotEmpty(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("btn_save_round_receipt"),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = TimberGold)
                    ) {
                        Icon(imageVector = Icons.Default.Save, contentDescription = null, tint = TimberDark)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Save Receipt Snapshot", color = TimberDark, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
