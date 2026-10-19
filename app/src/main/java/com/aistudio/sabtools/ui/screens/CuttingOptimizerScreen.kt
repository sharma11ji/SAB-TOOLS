package com.aistudio.sabtools.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
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
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.sabtools.logic.CuttingOptimizer
import com.aistudio.sabtools.model.CuttingOptimizationResult
import com.aistudio.sabtools.model.CuttingPart
import com.aistudio.sabtools.model.CuttingStock
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
import java.util.UUID

@Composable
fun CuttingOptimizerScreen(
    onBack: () -> Unit
) {
    val stocks = remember {
        mutableStateListOf(
            CuttingStock(
                id = UUID.randomUUID().toString(),
                name = "Plywood Sheet 8x4",
                material = "Plywood",
                thickness = 18.0,
                length = 2440.0,
                width = 1220.0,
                quantity = 2
            )
        )
    }

    val parts = remember {
        mutableStateListOf(
            CuttingPart(
                id = UUID.randomUUID().toString(),
                name = "Side Panel",
                material = "Plywood",
                thickness = 18.0,
                length = 720.0,
                width = 560.0,
                quantity = 4,
                rotate = true
            ),
            CuttingPart(
                id = UUID.randomUUID().toString(),
                name = "Top Shelf",
                material = "Plywood",
                thickness = 18.0,
                length = 800.0,
                width = 400.0,
                quantity = 2,
                rotate = true
            )
        )
    }

    var kerfStr by remember { mutableStateOf("3") }
    var trimStr by remember { mutableStateOf("5") }

    var optimizationResult by remember { mutableStateOf<CuttingOptimizationResult?>(null) }

    fun runOptimization() {
        val k = kerfStr.toDoubleOrNull() ?: 3.0
        val t = trimStr.toDoubleOrNull() ?: 5.0
        optimizationResult = CuttingOptimizer.optimize(stocks = stocks, parts = parts, kerf = k, trim = t)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(TimberBackground)
            .padding(16.dp)
            .testTag("cutting_optimizer_screen")
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
                    text = "Cutting Optimizer",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Explanation card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = TimberDark)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(TimberGoldLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.ContentCut,
                            contentDescription = null,
                            tint = TimberPrimary,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(14.dp))
                    Column {
                        Text(
                            text = "2D Guillotine Packing",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TimberGold
                        )
                        Text(
                            text = "Calculates minimal waste and produces exact straight-line cut plans for plywood, MDF & timber sheets.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TimberSurface.copy(alpha = 0.8f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Blade Kerf & Trim Inputs
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = kerfStr,
                    onValueChange = { kerfStr = it },
                    label = { Text("Blade Kerf (mm)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.weight(1f).testTag("input_kerf"),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TimberGold,
                        unfocusedBorderColor = TimberOutline
                    )
                )

                OutlinedTextField(
                    value = trimStr,
                    onValueChange = { trimStr = it },
                    label = { Text("Edge Trim (mm)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.weight(1f).testTag("input_trim"),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TimberGold,
                        unfocusedBorderColor = TimberOutline
                    )
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Stocks Section Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Stock Sheets Available",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Button(
                    onClick = {
                        stocks.add(
                            CuttingStock(
                                id = UUID.randomUUID().toString(),
                                name = "Sheet #${stocks.size + 1}",
                                material = "Plywood",
                                thickness = 18.0,
                                length = 2440.0,
                                width = 1220.0,
                                quantity = 1
                            )
                        )
                    },
                    modifier = Modifier.testTag("btn_add_stock"),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TimberPrimary)
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add Stock", fontSize = 12.sp)
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
        }

        // Stocks List
        itemsIndexed(stocks) { index, stock ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = TimberSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        OutlinedTextField(
                            value = stock.name,
                            onValueChange = { stocks[index] = stock.copy(name = it) },
                            placeholder = { Text("Stock Name") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )

                        if (stocks.size > 1) {
                            IconButton(onClick = { stocks.removeAt(index) }) {
                                Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete stock", tint = MaterialTheme.colorScheme.error)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        OutlinedTextField(
                            value = stock.length.toString(),
                            onValueChange = { stocks[index] = stock.copy(length = it.toDoubleOrNull() ?: 0.0) },
                            placeholder = { Text("L (mm)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )

                        OutlinedTextField(
                            value = stock.width.toString(),
                            onValueChange = { stocks[index] = stock.copy(width = it.toDoubleOrNull() ?: 0.0) },
                            placeholder = { Text("W (mm)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )

                        OutlinedTextField(
                            value = stock.quantity.toString(),
                            onValueChange = { stocks[index] = stock.copy(quantity = it.toIntOrNull() ?: 1) },
                            placeholder = { Text("Qty") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(0.7f),
                            shape = RoundedCornerShape(8.dp)
                        )
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))

            // Cut Parts Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Parts to Cut",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Button(
                    onClick = {
                        parts.add(
                            CuttingPart(
                                id = UUID.randomUUID().toString(),
                                name = "Part #${parts.size + 1}",
                                material = "Plywood",
                                thickness = 18.0,
                                length = 600.0,
                                width = 400.0,
                                quantity = 1,
                                rotate = true
                            )
                        )
                    },
                    modifier = Modifier.testTag("btn_add_part"),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TimberPrimary)
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add Part", fontSize = 12.sp)
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
        }

        // Parts List
        itemsIndexed(parts) { index, part ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = TimberSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        OutlinedTextField(
                            value = part.name,
                            onValueChange = { parts[index] = part.copy(name = it) },
                            placeholder = { Text("Part Name") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )

                        if (parts.size > 1) {
                            IconButton(onClick = { parts.removeAt(index) }) {
                                Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete part", tint = MaterialTheme.colorScheme.error)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = part.length.toString(),
                            onValueChange = { parts[index] = part.copy(length = it.toDoubleOrNull() ?: 0.0) },
                            placeholder = { Text("L (mm)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )

                        OutlinedTextField(
                            value = part.width.toString(),
                            onValueChange = { parts[index] = part.copy(width = it.toDoubleOrNull() ?: 0.0) },
                            placeholder = { Text("W (mm)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        )

                        OutlinedTextField(
                            value = part.quantity.toString(),
                            onValueChange = { parts[index] = part.copy(quantity = it.toIntOrNull() ?: 1) },
                            placeholder = { Text("Qty") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(0.7f),
                            shape = RoundedCornerShape(8.dp)
                        )

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(
                                checked = part.rotate,
                                onCheckedChange = { parts[index] = part.copy(rotate = it) },
                                colors = CheckboxDefaults.colors(checkedColor = TimberPrimary)
                            )
                            Text("Rot", fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(14.dp))

            Button(
                onClick = { runOptimization() },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("btn_run_optimizer"),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = TimberGold)
            ) {
                Icon(imageVector = Icons.Default.PlayArrow, contentDescription = null, tint = TimberDark)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Generate Optimized Cut Plan", color = TimberDark, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }

            Spacer(modifier = Modifier.height(16.dp))

            val result = optimizationResult
            if (result != null) {
                // Optimization Summary Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("cutting_summary_card"),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = TimberDark)
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Text(
                            text = "OPTIMIZATION SUMMARY",
                            style = MaterialTheme.typography.labelSmall,
                            color = TimberGold,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Sheets Used", color = TimberSurface.copy(alpha = 0.7f), fontSize = 12.sp)
                                Text("${result.summary.totalSheets} sheets", color = TimberSurface, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            }

                            Column {
                                Text("Parts Placed", color = TimberSurface.copy(alpha = 0.7f), fontSize = 12.sp)
                                Text("${result.summary.totalPartsPlaced} pcs", color = TimberSurface, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                Text("Efficiency", color = TimberSurface.copy(alpha = 0.7f), fontSize = 12.sp)
                                Text("${result.summary.usedPercent}%", color = TimberGold, fontWeight = FontWeight.Black, fontSize = 18.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Waste: ${result.summary.wastePercent}% · Total cuts: ${result.summary.totalCuts}",
                            color = TimberSurface.copy(alpha = 0.8f),
                            fontSize = 12.sp
                        )

                        if (result.unplacedParts.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "⚠️ Unplaced parts: ${result.unplacedParts.joinToString(", ")} (increase stock sheet count)",
                                color = TimberGoldLight,
                                fontSize = 12.sp
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Visual Sheet Diagram
                result.sheets.forEach { sheet ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = TimberSurface),
                        border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = "Sheet #${sheet.sheetIndex} · ${sheet.name} (${sheet.length.toInt()} × ${sheet.width.toInt()} mm)",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = TimberPrimary
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            // 2D Canvas Diagram
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .aspectRatio(sheet.length.toFloat() / sheet.width.toFloat().coerceAtLeast(1f))
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFE5DAC8))
                                    .border(1.dp, Color(0xFF80501C), RoundedCornerShape(8.dp))
                            ) {
                                Canvas(modifier = Modifier.fillMaxSize()) {
                                    val scaleX = size.width / sheet.length.toFloat()
                                    val scaleY = size.height / sheet.width.toFloat()

                                    // Draw placed parts
                                    sheet.placements.forEach { p ->
                                        val px = p.x.toFloat() * scaleX
                                        val py = p.y.toFloat() * scaleY
                                        val pw = p.w.toFloat() * scaleX
                                        val ph = p.h.toFloat() * scaleY

                                        drawRect(
                                            color = Color(0xFFC68A35),
                                            topLeft = Offset(px, py),
                                            size = Size(pw, ph)
                                        )
                                        drawRect(
                                            color = Color(0xFF17130E),
                                            topLeft = Offset(px, py),
                                            size = Size(pw, ph),
                                            style = Stroke(width = 1.5f)
                                        )
                                    }

                                    // Draw cut lines
                                    sheet.cuts.forEach { cut ->
                                        if (cut.axis == "vertical") {
                                            val cx = cut.x.toFloat() * scaleX
                                            val cy1 = cut.y.toFloat() * scaleY
                                            val cy2 = (cut.y + cut.span).toFloat() * scaleY
                                            drawLine(
                                                color = Color.Red,
                                                start = Offset(cx, cy1),
                                                end = Offset(cx, cy2),
                                                strokeWidth = 2f
                                            )
                                        } else {
                                            val cy = cut.y.toFloat() * scaleY
                                            val cx1 = cut.x.toFloat() * scaleX
                                            val cx2 = (cut.x + cut.span).toFloat() * scaleX
                                            drawLine(
                                                color = Color.Red,
                                                start = Offset(cx1, cy),
                                                end = Offset(cx2, cy),
                                                strokeWidth = 2f
                                            )
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Placed ${sheet.placements.size} parts: ${sheet.placements.joinToString(", ") { "${it.name} (${it.w.toInt()}x${it.h.toInt()})" }}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TimberTextSecondary
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
