package com.aistudio.sabtools.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.sabtools.data.ReceiptRepository
import com.aistudio.sabtools.logic.CustomerAggregator
import com.aistudio.sabtools.logic.PaymentLedger
import com.aistudio.sabtools.model.CustomerSummary
import com.aistudio.sabtools.ui.theme.TimberBackground
import com.aistudio.sabtools.ui.theme.TimberGold
import com.aistudio.sabtools.ui.theme.TimberGoldLight
import com.aistudio.sabtools.ui.theme.TimberOutline
import com.aistudio.sabtools.ui.theme.TimberPrimary
import com.aistudio.sabtools.ui.theme.TimberSuccess
import com.aistudio.sabtools.ui.theme.TimberSuccessContainer
import com.aistudio.sabtools.ui.theme.TimberSurface
import com.aistudio.sabtools.ui.theme.TimberTextSecondary

@Composable
fun CustomerListScreen(
    repository: ReceiptRepository,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val receipts by repository.allTimberReceipts.collectAsState(initial = emptyList())
    var searchQuery by remember { mutableStateOf("") }
    val expandedMap = remember { mutableStateMapOf<String, Boolean>() }

    val allCustomers = remember(receipts) {
        CustomerAggregator.buildCustomerSummaries(receipts)
    }

    val filteredCustomers = remember(allCustomers, searchQuery) {
        CustomerAggregator.filterCustomers(allCustomers, searchQuery)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(TimberBackground)
            .padding(16.dp)
            .testTag("customer_list_screen")
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
                    text = "Customer List",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search by name, village, or phone...") },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.Search, contentDescription = "Search", tint = TimberPrimary)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("input_customer_search"),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = TimberGold,
                    unfocusedBorderColor = TimberOutline
                )
            )

            Spacer(modifier = Modifier.height(14.dp))

            if (filteredCustomers.isEmpty()) {
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
                            text = if (searchQuery.isBlank()) "No customers found yet. Create and save timber receipts to automatically populate customers." else "No customers match '$searchQuery'.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TimberTextSecondary
                        )
                    }
                }
            }
        }

        items(filteredCustomers, key = { it.key }) { customer ->
            val isExpanded = expandedMap[customer.key] == true

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp)
                    .testTag("customer_card_${customer.key}"),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = TimberSurface),
                border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { expandedMap[customer.key] = !isExpanded },
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(TimberGoldLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    tint = TimberPrimary,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = customer.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                if (customer.village.isNotBlank()) {
                                    Text(
                                        text = customer.village,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TimberTextSecondary
                                    )
                                }
                            }
                        }

                        Icon(
                            imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                            contentDescription = if (isExpanded) "Collapse" else "Expand",
                            tint = TimberPrimary
                        )
                    }

                    if (customer.phone.isNotBlank()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(TimberGoldLight.copy(alpha = 0.5f))
                                .clickable {
                                    val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${customer.phone}"))
                                    context.startActivity(dialIntent)
                                }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Call, contentDescription = "Call", tint = TimberPrimary, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = customer.phone,
                                style = MaterialTheme.typography.bodySmall,
                                color = TimberPrimary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Stats Badges Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(TimberBackground)
                                .padding(8.dp)
                        ) {
                            Text("Total Billed", style = MaterialTheme.typography.labelSmall, color = TimberTextSecondary)
                            Text(
                                text = PaymentLedger.formatCurrency(customer.total),
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (customer.pending > 0.01) TimberGoldLight else TimberSuccessContainer)
                                .padding(8.dp)
                        ) {
                            Text("Pending Due", style = MaterialTheme.typography.labelSmall, color = TimberTextSecondary)
                            Text(
                                text = PaymentLedger.formatCurrency(customer.pending),
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = if (customer.pending > 0.01) TimberPrimary else TimberSuccess
                            )
                        }

                        Column(
                            modifier = Modifier
                                .weight(0.7f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(TimberBackground)
                                .padding(8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("Receipts", style = MaterialTheme.typography.labelSmall, color = TimberTextSecondary)
                            Text(
                                text = "${customer.receipts.size}",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    // Expandable Receipts List
                    AnimatedVisibility(visible = isExpanded) {
                        Column(modifier = Modifier.padding(top = 12.dp)) {
                            Text(
                                text = "Receipt History",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = TimberPrimary
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            customer.receipts.forEach { item ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(TimberBackground)
                                        .padding(8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = "Receipt #${item.receiptNumber} · ${item.date}",
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        Text(
                                            text = if (item.balance <= 0.01) "Fully paid" else "Pending: ${PaymentLedger.formatCurrency(item.balance)}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = if (item.balance <= 0.01) TimberSuccess else TimberPrimary
                                        )
                                    }

                                    Text(
                                        text = PaymentLedger.formatCurrency(item.total),
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
