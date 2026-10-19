import fs from 'node:fs';

const requiredFiles = [
  'metadata.json',
  'settings.gradle.kts',
  'build.gradle.kts',
  'gradle/libs.versions.toml',
  'app/build.gradle.kts',
  'app/src/main/AndroidManifest.xml',
  'app/src/main/res/values/strings.xml',
  'app/src/main/res/values/colors.xml',
  'app/src/main/res/values/themes.xml',
  'app/src/main/res/drawable/ic_launcher_foreground.xml',
  'app/src/main/res/drawable/ic_launcher_background.xml',
  'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
  'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
  'app/src/main/java/com/aistudio/sabtools/MainActivity.kt',
  'app/src/main/java/com/aistudio/sabtools/model/WoodModels.kt',
  'app/src/main/java/com/aistudio/sabtools/model/ReceiptModels.kt',
  'app/src/main/java/com/aistudio/sabtools/model/CuttingModels.kt',
  'app/src/main/java/com/aistudio/sabtools/model/StoreProfileModels.kt',
  'app/src/main/java/com/aistudio/sabtools/logic/WoodCalculations.kt',
  'app/src/main/java/com/aistudio/sabtools/logic/PaymentLedger.kt',
  'app/src/main/java/com/aistudio/sabtools/logic/CuttingOptimizer.kt',
  'app/src/main/java/com/aistudio/sabtools/logic/CustomerAggregator.kt',
  'app/src/main/java/com/aistudio/sabtools/logic/SalesReporter.kt',
  'app/src/main/java/com/aistudio/sabtools/data/ReceiptEntity.kt',
  'app/src/main/java/com/aistudio/sabtools/data/ReceiptDao.kt',
  'app/src/main/java/com/aistudio/sabtools/data/AppDatabase.kt',
  'app/src/main/java/com/aistudio/sabtools/data/ReceiptRepository.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/theme/Color.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/theme/Type.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/theme/Theme.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/navigation/NavScreen.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/screens/HomeScreen.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/screens/WoodCalculatorScreen.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/screens/RoundWoodMultiScreen.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/screens/TimberReceiptScreen.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/screens/CuttingOptimizerScreen.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/screens/BakiHisabScreen.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/screens/CustomerListScreen.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/screens/SalesReportScreen.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/screens/SavedReceiptsScreen.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/screens/BubbleLevelScreen.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/screens/StoreProfileScreen.kt',
  'app/src/main/java/com/aistudio/sabtools/ui/screens/UserManualScreen.kt'
];

let missing = 0;
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`Missing Android file: ${file}`);
    missing++;
  }
}

if (missing > 0) {
  console.error(`Verification failed: ${missing} files missing.`);
  process.exit(1);
}

console.log(`[INFO] Android verification successful: all ${requiredFiles.length} files present and valid.`);
