package com.aistudio.sabtools.ui.screens

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
import java.util.Locale
import kotlin.math.atan2
import kotlin.math.hypot

@Composable
fun BubbleLevelScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var rawPitch by remember { mutableFloatStateOf(0f) }
    var rawRoll by remember { mutableFloatStateOf(0f) }

    var offsetPitch by remember { mutableFloatStateOf(0f) }
    var offsetRoll by remember { mutableFloatStateOf(0f) }

    DisposableEffect(Unit) {
        val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
        val accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

        val listener = object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent?) {
                if (event == null) return
                val ax = event.values[0]
                val ay = event.values[1]
                val az = event.values[2]

                // Calculate roll (left/right tilt) and pitch (front/back tilt) in degrees
                val pitch = (atan2(ax.toDouble(), hypot(ay.toDouble(), az.toDouble())) * 180.0 / Math.PI).toFloat()
                val roll = (atan2(ay.toDouble(), hypot(ax.toDouble(), az.toDouble())) * 180.0 / Math.PI).toFloat()

                rawPitch = pitch
                rawRoll = roll
            }

            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
        }

        sensorManager?.registerListener(listener, accelerometer, SensorManager.SENSOR_DELAY_UI)

        onDispose {
            sensorManager?.unregisterListener(listener)
        }
    }

    val currentPitch = rawPitch - offsetPitch
    val currentRoll = rawRoll - offsetRoll
    val isNearLevel = kotlin.math.abs(currentPitch) < 2f && kotlin.math.abs(currentRoll) < 2f

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(TimberBackground)
            .padding(16.dp)
            .testTag("bubble_level_screen"),
        horizontalAlignment = Alignment.CenterHorizontally
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
                text = "Bubble Level",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "Place phone flat on sawmill table, workbench, or lumber surface.",
            style = MaterialTheme.typography.bodySmall,
            color = TimberTextSecondary,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Level Circular Gauge Display
        Card(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .aspectRatio(1f)
                .testTag("bubble_level_gauge"),
            shape = CircleShape,
            colors = CardDefaults.cardColors(containerColor = if (isNearLevel) Color(0xFFE8F5E9) else TimberSurface),
            border = androidx.compose.foundation.BorderStroke(3.dp, if (isNearLevel) TimberSuccess else TimberPrimary),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                // Crosshairs
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val cx = size.width / 2f
                    val cy = size.height / 2f
                    val r = size.width / 2f

                    // Target rings
                    drawCircle(color = Color(0xFFD8CDBC), radius = r * 0.25f, style = Stroke(width = 2f))
                    drawCircle(color = Color(0xFFD8CDBC), radius = r * 0.5f, style = Stroke(width = 2f))
                    drawCircle(color = Color(0xFFD8CDBC), radius = r * 0.75f, style = Stroke(width = 2f))

                    // Crosshair lines
                    drawLine(color = Color(0xFFB0A492), start = Offset(0f, cy), end = Offset(size.width, cy), strokeWidth = 2f)
                    drawLine(color = Color(0xFFB0A492), start = Offset(cx, 0f), end = Offset(cx, size.height), strokeWidth = 2f)

                    // Bubble position
                    // Limit bubble displacement to 80% radius
                    val maxOffset = r * 0.75f
                    val bx = (currentPitch / 20f).coerceIn(-1f, 1f) * maxOffset
                    val by = (currentRoll / 20f).coerceIn(-1f, 1f) * maxOffset

                    val bubbleColor = if (isNearLevel) Color(0xFF2E7D32) else Color(0xFFC68A35)
                    drawCircle(color = bubbleColor, radius = 24.dp.toPx(), center = Offset(cx + bx, cy + by))
                    drawCircle(color = Color.White.copy(alpha = 0.5f), radius = 8.dp.toPx(), center = Offset(cx + bx - 6.dp.toPx(), cy + by - 6.dp.toPx()))
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Status Readout Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (isNearLevel) TimberSuccessContainer else TimberDark
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = if (isNearLevel) "NEAR LEVEL (Within 2°)" else "SURFACE IS TILTED",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = if (isNearLevel) TimberSuccess else TimberGold
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "Left / Right (Pitch)",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (isNearLevel) TimberSuccess else TimberSurface.copy(alpha = 0.7f)
                        )
                        Text(
                            text = String.format(Locale.US, "%.1f°", currentPitch),
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (isNearLevel) TimberSuccess else TimberSurface
                        )
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "Front / Back (Roll)",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (isNearLevel) TimberSuccess else TimberSurface.copy(alpha = 0.7f)
                        )
                        Text(
                            text = String.format(Locale.US, "%.1f°", currentRoll),
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (isNearLevel) TimberSuccess else TimberSurface
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Button(
                onClick = {
                    offsetPitch = rawPitch
                    offsetRoll = rawRoll
                },
                modifier = Modifier.weight(1f).testTag("btn_calibrate_zero"),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = TimberPrimary)
            ) {
                Text("Set Current as Zero", fontSize = 13.sp)
            }

            OutlinedButton(
                onClick = {
                    offsetPitch = 0f
                    offsetRoll = 0f
                },
                modifier = Modifier.weight(1f).testTag("btn_reset_zero"),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("Reset Zero", fontSize = 13.sp, color = TimberPrimary)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = if (offsetPitch != 0f || offsetRoll != 0f) "Readings are relative to your custom calibrated surface." else "Readings use device internal sensor reference.",
            style = MaterialTheme.typography.bodySmall,
            color = TimberTextSecondary,
            fontSize = 12.sp
        )
    }
}
