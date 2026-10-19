package com.aistudio.sabtools

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aistudio.sabtools.data.AppDatabase
import com.aistudio.sabtools.data.ReceiptRepository
import com.aistudio.sabtools.model.StoreProfileData
import com.aistudio.sabtools.ui.navigation.NavScreen
import com.aistudio.sabtools.ui.screens.BakiHisabScreen
import com.aistudio.sabtools.ui.screens.BubbleLevelScreen
import com.aistudio.sabtools.ui.screens.CustomerListScreen
import com.aistudio.sabtools.ui.screens.CuttingOptimizerScreen
import com.aistudio.sabtools.ui.screens.HomeScreen
import com.aistudio.sabtools.ui.screens.RoundWoodMultiScreen
import com.aistudio.sabtools.ui.screens.SalesReportScreen
import com.aistudio.sabtools.ui.screens.SavedReceiptsScreen
import com.aistudio.sabtools.ui.screens.StoreProfileScreen
import com.aistudio.sabtools.ui.screens.TimberReceiptScreen
import com.aistudio.sabtools.ui.screens.UserManualScreen
import com.aistudio.sabtools.ui.screens.WoodCalculatorScreen
import com.aistudio.sabtools.ui.theme.SABTOOLSTheme
import com.aistudio.sabtools.ui.theme.TimberBackground
import com.aistudio.sabtools.ui.theme.TimberOutline
import com.aistudio.sabtools.ui.theme.TimberPrimary
import com.aistudio.sabtools.ui.theme.TimberSurface
import com.aistudio.sabtools.ui.theme.TimberSurfaceVariant

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val db = AppDatabase.getInstance(applicationContext)
        val repository = ReceiptRepository(db)

        setContent {
            SABTOOLSTheme {
                MainAppScaffold(repository = repository)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScaffold(repository: ReceiptRepository) {
    val storeProfile by repository.storeProfile.collectAsState(initial = StoreProfileData())
    val navStack = remember { mutableStateListOf<NavScreen>(NavScreen.Home) }
    val currentScreen = navStack.lastOrNull() ?: NavScreen.Home

    var showMenu by remember { mutableStateOf(false) }

    fun navigateTo(screen: NavScreen) {
        if (screen is NavScreen.Home) {
            navStack.clear()
            navStack.add(NavScreen.Home)
        } else {
            navStack.add(screen)
        }
    }

    fun navigateBack() {
        if (navStack.size > 1) {
            navStack.removeAt(navStack.size - 1)
        }
    }

    BackHandler(enabled = navStack.size > 1) {
        navigateBack()
    }

    val grayscaleMatrix = remember { ColorMatrix().apply { setToSaturation(0f) } }

    Scaffold(
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(TimberSurface.copy(alpha = 0.84f))
            ) {
                CenterAlignedTopAppBar(
                    title = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .clickable { navigateTo(NavScreen.Home) }
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                                .testTag("app_brand_header")
                        ) {
                            Image(
                                painter = painterResource(id = R.drawable.logo_timber),
                                contentDescription = "SAB TOOLS Logo",
                                colorFilter = ColorFilter.colorMatrix(grayscaleMatrix),
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(RoundedCornerShape(8.dp))
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "SAB TOOLS",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Black,
                                letterSpacing = (-0.5).sp,
                                color = TimberPrimary
                            )
                        }
                    },
                    navigationIcon = {
                        if (currentScreen !is NavScreen.Home) {
                            IconButton(
                                onClick = { navigateTo(NavScreen.Home) },
                                modifier = Modifier
                                    .padding(start = 6.dp)
                                    .size(38.dp)
                                    .clip(CircleShape)
                                    .background(TimberSurfaceVariant)
                                    .border(1.dp, TimberOutline, CircleShape)
                                    .testTag("btn_top_home")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Home,
                                    contentDescription = "Home",
                                    tint = TimberPrimary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    },
                    actions = {
                        Box(modifier = Modifier.padding(end = 6.dp)) {
                            IconButton(
                                onClick = { showMenu = true },
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(CircleShape)
                                    .background(TimberSurfaceVariant)
                                    .border(1.dp, TimberOutline, CircleShape)
                                    .testTag("btn_top_menu")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Menu,
                                    contentDescription = "Menu",
                                    tint = TimberPrimary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }

                            DropdownMenu(
                                expanded = showMenu,
                                onDismissRequest = { showMenu = false },
                                modifier = Modifier.background(TimberSurface)
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Home", fontWeight = FontWeight.SemiBold) },
                                    onClick = {
                                        showMenu = false
                                        navigateTo(NavScreen.Home)
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Timber Receipt") },
                                    onClick = {
                                        showMenu = false
                                        navigateTo(NavScreen.TimberReceipt)
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Baki Hisab") },
                                    onClick = {
                                        showMenu = false
                                        navigateTo(NavScreen.BakiHisab)
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Customer List") },
                                    onClick = {
                                        showMenu = false
                                        navigateTo(NavScreen.Customers)
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Cutting Optimizer") },
                                    onClick = {
                                        showMenu = false
                                        navigateTo(NavScreen.CuttingOptimizer)
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Sale Report") },
                                    onClick = {
                                        showMenu = false
                                        navigateTo(NavScreen.SalesReport)
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Bubble Level") },
                                    onClick = {
                                        showMenu = false
                                        navigateTo(NavScreen.BubbleLevel)
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Store Profile") },
                                    onClick = {
                                        showMenu = false
                                        navigateTo(NavScreen.StoreProfile)
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("User Manual & Formulas") },
                                    onClick = {
                                        showMenu = false
                                        navigateTo(NavScreen.UserManual)
                                    }
                                )
                            }
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = Color.Transparent
                    )
                )
                HorizontalDivider(
                    modifier = Modifier.fillMaxWidth(),
                    thickness = 0.8.dp,
                    color = TimberOutline.copy(alpha = 0.7f)
                )
            }
        }
    ) { innerPadding ->
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            color = TimberBackground
        ) {
            when (currentScreen) {
                is NavScreen.Home -> HomeScreen(
                    storeProfile = storeProfile,
                    onNavigate = { navigateTo(it) }
                )
                is NavScreen.SingleWood -> WoodCalculatorScreen(
                    initialKind = currentScreen.kind,
                    initialSystem = currentScreen.system,
                    onBack = { navigateBack() }
                )
                is NavScreen.RoundMulti -> RoundWoodMultiScreen(
                    initialSystem = currentScreen.system,
                    repository = repository,
                    storeProfile = storeProfile,
                    onBack = { navigateBack() }
                )
                is NavScreen.TimberReceipt -> TimberReceiptScreen(
                    repository = repository,
                    storeProfile = storeProfile,
                    onBack = { navigateBack() }
                )
                is NavScreen.CuttingOptimizer -> CuttingOptimizerScreen(
                    onBack = { navigateBack() }
                )
                is NavScreen.BakiHisab -> BakiHisabScreen(
                    repository = repository,
                    onBack = { navigateBack() }
                )
                is NavScreen.Customers -> CustomerListScreen(
                    repository = repository,
                    onBack = { navigateBack() }
                )
                is NavScreen.SalesReport -> SalesReportScreen(
                    repository = repository,
                    onBack = { navigateBack() }
                )
                is NavScreen.SavedReceipts -> SavedReceiptsScreen(
                    repository = repository,
                    onBack = { navigateBack() }
                )
                is NavScreen.BubbleLevel -> BubbleLevelScreen(
                    onBack = { navigateBack() }
                )
                is NavScreen.StoreProfile -> StoreProfileScreen(
                    currentProfile = storeProfile,
                    repository = repository,
                    onBack = { navigateBack() }
                )
                is NavScreen.UserManual -> UserManualScreen(
                    onBack = { navigateBack() }
                )
            }
        }
    }
}
