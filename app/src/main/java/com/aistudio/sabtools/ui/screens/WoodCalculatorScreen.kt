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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DoorBack
import androidx.compose.material.icons.filled.Forest
import androidx.compose.material.icons.filled.ViewInAr
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.sabtools.logic.PaymentLedger
import com.aistudio.sabtools.logic.WoodCalculations
import com.aistudio.sabtools.model.MeasurementSystem
import com.aistudio.sabtools.model.WoodKind
import com.aistudio.sabtools.ui.theme.TimberBackground
import com.aistudio.sabtools.ui.theme.TimberDark
import com.aistudio.sabtools.ui.theme.TimberGold
import com.aistudio.sabtools.ui.theme.TimberGoldLight
import com.aistudio.sabtools.ui.theme.TimberOutline
import com.aistudio.sabtools.ui.theme.TimberPrimary
import com.aistudio.sabtools.ui.theme.TimberSurface
import com.aistudio.sabtools.ui.theme.TimberTextSecondary
import java.util.Locale

@Composable
fun WoodCalculatorScreen(
    initialKind: WoodKind,
    initialSystem: MeasurementSystem,
    onBack: () -> Unit
) {
    var system by remember { mutableStateOf(initialSystem) }
    val kind = initialKind

    var lengthStr by remember { mutableStateOf("") }
    var widthOrGirthStr by remember { mutableStateOf("") }
    var thicknessStr by remember { mutableStateOf("") }
    var piecesStr by remember { mutableStateOf("1") }
    var rateStr by remember { mutableStateOf("") }

    val metric = system == MeasurementSystem.METRIC
    val isDoor = kind == WoodKind.DOOR
    val isSize = kind == WoodKind.SIZE

    val unit = when (kind) {
        WoodKind.DOOR -> if (metric) "sq m" else "sq ft"
        else -> if (metric) "CBM" else "CFT"
    }

    val length = lengthStr.toDoubleOrNull() ?: 0.0
    val widthOrGirth = widthOrGirthStr.toDoubleOrNull() ?: 0.0
    val thickness = thicknessStr.toDoubleOrNull() ?: 0.0
    val pieces = piecesStr.toIntOrNull() ?: 1
    val rate = rateStr.toDoubleOrNull() ?: 0.0

    val result = WoodCalculations.calculateWood(
        kind = kind,
        system = system,
        length = length,
        widthOrGirth = widthOrGirth,
        thickness = thickness,
        pieces = pieces,
        rate = rate
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(TimberBackground)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
            .testTag("wood_calculator_screen")
    ) {
        // Top row with back button
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            IconButton(
                onClick = onBack,
                modifier = Modifier.testTag("btn_back")
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = TimberPrimary
                )
            }
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = kind.title,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(TimberGoldLight)
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = if (metric) (if (isDoor) "M²" else "M³") else (if (isDoor) "F²" else "F³"),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = TimberPrimary
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // System Switcher (Foot, Inch vs Meter, cm)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(TimberSurface)
                .border(1.dp, TimberOutline, RoundedCornerShape(12.dp))
                .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            val systems = listOf(MeasurementSystem.IMPERIAL, MeasurementSystem.METRIC)
            for (sys in systems) {
                val selected = system == sys
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (selected) TimberDark else TimberSurface)
                        .clickable {
                            if (system != sys) {
                                system = sys
                                lengthStr = ""
                                widthOrGirthStr = ""
                                thicknessStr = ""
                                piecesStr = "1"
                                rateStr = ""
                            }
                        }
                        .padding(vertical = 10.dp)
                        .testTag("btn_system_${sys.name.lowercase()}"),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = sys.title,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                        color = if (selected) TimberSurface else MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Formula / Icon Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = TimberSurface),
            border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(TimberGoldLight),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = when (kind) {
                            WoodKind.SIZE -> Icons.Default.ViewInAr
                            WoodKind.DOOR -> Icons.Default.DoorBack
                            WoodKind.ROUND -> Icons.Default.Forest
                        },
                        contentDescription = null,
                        tint = TimberPrimary,
                        modifier = Modifier.size(26.dp)
                    )
                }

                Spacer(modifier = Modifier.width(14.dp))
                Column {
                    Text(
                        text = when (kind) {
                            WoodKind.SIZE -> "Plank volume formula"
                            WoodKind.DOOR -> "Flush door area formula"
                            WoodKind.ROUND -> "Quarter-girth log formula"
                        },
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = when (kind) {
                            WoodKind.SIZE -> if (metric) "Length(m) × (Width(cm) ÷ 100) × (Thick(cm) ÷ 100)" else "Length(ft) × Width(in) × Thick(in) ÷ 144"
                            WoodKind.DOOR -> if (metric) "Length(m) × Width(m) = sq m" else "Length(ft) × Width(ft) = sq ft"
                            WoodKind.ROUND -> if (metric) "Length(m) × (Girth(cm) ÷ 400)² = CBM" else "Length(ft) × Girth(in)² ÷ 2304 = CFT"
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = TimberTextSecondary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Input Form
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = TimberSurface),
            border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Measurements",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Length
                OutlinedTextField(
                    value = lengthStr,
                    onValueChange = { lengthStr = it },
                    label = { Text("Length (${if (metric) "m" else "ft"})") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_length"),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TimberGold,
                        unfocusedBorderColor = TimberOutline
                    )
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Width / Girth
                val widthLabel = when (kind) {
                    WoodKind.ROUND -> "Girth / Circumference (${if (metric) "cm" else "in"})"
                    WoodKind.DOOR -> "Width (${if (metric) "m" else "ft"})"
                    WoodKind.SIZE -> "Width (${if (metric) "cm" else "in"})"
                }

                OutlinedTextField(
                    value = widthOrGirthStr,
                    onValueChange = { widthOrGirthStr = it },
                    label = { Text(widthLabel) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_width_girth"),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TimberGold,
                        unfocusedBorderColor = TimberOutline
                    )
                )

                if (isSize) {
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = thicknessStr,
                        onValueChange = { thicknessStr = it },
                        label = { Text("Thickness (${if (metric) "cm" else "in"})") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_thickness"),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = TimberGold,
                            unfocusedBorderColor = TimberOutline
                        )
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = piecesStr,
                        onValueChange = { piecesStr = it },
                        label = { Text("Quantity (pcs)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("input_pieces"),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = TimberGold,
                            unfocusedBorderColor = TimberOutline
                        )
                    )

                    OutlinedTextField(
                        value = rateStr,
                        onValueChange = { rateStr = it },
                        label = { Text("Rate (₹ / $unit)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier
                            .weight(1.3f)
                            .testTag("input_rate"),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = TimberGold,
                            unfocusedBorderColor = TimberOutline
                        )
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Result Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("card_result"),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = TimberDark)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = if (isDoor) "TOTAL AREA" else "TOTAL VOLUME",
                    style = MaterialTheme.typography.labelSmall,
                    color = TimberGold,
                    letterSpacing = 1.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = if (result != null) {
                        String.format(Locale.US, "%.3f %s", result.quantity, result.unit)
                    } else "0.000 $unit",
                    style = MaterialTheme.typography.headlineLarge,
                    color = TimberSurface,
                    fontWeight = FontWeight.Black
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Total amount",
                            style = MaterialTheme.typography.bodySmall,
                            color = TimberSurface.copy(alpha = 0.7f)
                        )
                        Text(
                            text = if (result != null) PaymentLedger.formatCurrency(result.amount) else "₹0.00",
                            style = MaterialTheme.typography.headlineSmall,
                            color = TimberGold,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (result != null && pieces > 1) {
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "Per piece",
                                style = MaterialTheme.typography.bodySmall,
                                color = TimberSurface.copy(alpha = 0.7f)
                            )
                            Text(
                                text = String.format(Locale.US, "%.3f %s", result.perPiece, result.unit),
                                style = MaterialTheme.typography.bodyMedium,
                                color = TimberSurface,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }
    }
}
