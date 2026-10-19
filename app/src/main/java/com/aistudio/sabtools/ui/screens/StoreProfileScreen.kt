package com.aistudio.sabtools.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.CheckCircle
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.aistudio.sabtools.data.ReceiptRepository
import com.aistudio.sabtools.model.StoreProfileData
import com.aistudio.sabtools.ui.theme.TimberBackground
import com.aistudio.sabtools.ui.theme.TimberGold
import com.aistudio.sabtools.ui.theme.TimberOutline
import com.aistudio.sabtools.ui.theme.TimberPrimary
import com.aistudio.sabtools.ui.theme.TimberSuccess
import com.aistudio.sabtools.ui.theme.TimberSuccessContainer
import com.aistudio.sabtools.ui.theme.TimberSurface
import com.aistudio.sabtools.ui.theme.TimberTextSecondary
import kotlinx.coroutines.launch

@Composable
fun StoreProfileScreen(
    currentProfile: StoreProfileData,
    repository: ReceiptRepository,
    onBack: () -> Unit
) {
    var storeName by remember { mutableStateOf(currentProfile.storeName) }
    var ownerName by remember { mutableStateOf(currentProfile.ownerName) }
    var address by remember { mutableStateOf(currentProfile.address) }
    var mobile by remember { mutableStateOf(currentProfile.mobile) }

    var savedMessage by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(TimberBackground)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
            .testTag("store_profile_screen")
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
                text = "Store Profile",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(10.dp))
        Text(
            text = "Your business details appear on all generated timber bills and receipts.",
            style = MaterialTheme.typography.bodySmall,
            color = TimberTextSecondary
        )

        if (savedMessage.isNotBlank()) {
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
                        text = savedMessage,
                        style = MaterialTheme.typography.bodySmall,
                        color = TimberSuccess,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = TimberSurface),
            border = androidx.compose.foundation.BorderStroke(1.dp, TimberOutline)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                OutlinedTextField(
                    value = storeName,
                    onValueChange = {
                        storeName = it
                        savedMessage = ""
                    },
                    label = { Text("Store / Sawmill Name") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_store_name"),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TimberGold,
                        unfocusedBorderColor = TimberOutline
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = ownerName,
                    onValueChange = {
                        ownerName = it
                        savedMessage = ""
                    },
                    label = { Text("Owner's Name") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_owner_name"),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TimberGold,
                        unfocusedBorderColor = TimberOutline
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = mobile,
                    onValueChange = {
                        mobile = it
                        savedMessage = ""
                    },
                    label = { Text("Mobile Phone Number") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_store_mobile"),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TimberGold,
                        unfocusedBorderColor = TimberOutline
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = address,
                    onValueChange = {
                        address = it
                        savedMessage = ""
                    },
                    label = { Text("Address / Location") },
                    minLines = 3,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_store_address"),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TimberGold,
                        unfocusedBorderColor = TimberOutline
                    )
                )

                Spacer(modifier = Modifier.height(18.dp))

                Button(
                    onClick = {
                        scope.launch {
                            val updated = StoreProfileData(
                                storeName = storeName.trim(),
                                ownerName = ownerName.trim(),
                                address = address.trim(),
                                mobile = mobile.trim()
                            )
                            repository.saveStoreProfile(updated)
                            savedMessage = "Store profile saved successfully!"
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("btn_save_store_profile"),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TimberPrimary)
                ) {
                    Icon(imageVector = Icons.Default.Save, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Save Store Profile", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
