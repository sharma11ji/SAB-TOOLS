package com.aistudio.sabtools.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.sabtools.ui.theme.TimberBackground
import com.aistudio.sabtools.ui.theme.TimberDark
import com.aistudio.sabtools.ui.theme.TimberGold
import com.aistudio.sabtools.ui.theme.TimberOutline
import com.aistudio.sabtools.ui.theme.TimberPrimary
import com.aistudio.sabtools.ui.theme.TimberSurface
import com.aistudio.sabtools.ui.theme.TimberTextSecondary

@Composable
fun UserManualScreen(
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(TimberBackground)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
            .testTag("user_manual_screen")
    ) {
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
                text = "Manual & Formulas",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Round Log Quarter Girth Formula Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = TimberSurface),
            border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "1. Round Wood (Quarter-Girth Method)",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TimberPrimary
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Standard forestry and sawmill formula for calculating usable cubic timber in a cylindrical tree log:",
                    style = MaterialTheme.typography.bodySmall,
                    color = TimberTextSecondary
                )
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = TimberDark)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "Imperial (CFT):",
                            color = TimberGold,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                        Text(
                            text = "Volume (CFT) = Length(ft) × Girth(in)² ÷ 2304",
                            color = TimberSurface,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Metric (CBM):",
                            color = TimberGold,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                        Text(
                            text = "Volume (CBM) = Length(m) × (Girth(cm) ÷ 400)²",
                            color = TimberSurface,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "• Girth is the circumference measured with a measuring tape around the middle of the log, not diameter.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TimberTextSecondary
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Size Wood / Planks
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = TimberSurface),
            border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "2. Size Wood (Rectangular Planks / Sawn Timber)",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TimberPrimary
                )
                Spacer(modifier = Modifier.height(6.dp))
                Card(
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = TimberDark)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "Volume (CFT) = Length(ft) × Width(in) × Thickness(in) ÷ 144",
                            color = TimberSurface,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Volume (CBM) = Length(m) × (Width(cm) ÷ 100) × (Thick(cm) ÷ 100)",
                            color = TimberGold,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Unit Conversion & Business Tools
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = TimberSurface),
            border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "3. Unit Conversion & Ledger",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TimberPrimary
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "• 1 Cubic Metre (CBM) = 35.3147 Cubic Feet (CFT)\n" +
                            "• Baki Hisab tracks all customer receipts saved with pending balances.\n" +
                            "• When full payment is collected via 'Mark Paid' or partial payments, the receipt automatically updates to Paid.\n" +
                            "• The Customer list is compiled dynamically from receipts so you never lose contact or account history.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TimberTextSecondary,
                    lineHeight = 20.sp
                )
            }
        }
    }
}
