package com.alentadev.shopping.feature.listdetail.ui.detail

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.alentadev.shopping.ui.theme.ShoppingTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ListDetailTopBarInstrumentedTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun listDetailTopBar_displaysProviderAlongsideTitle_whenProviderExists() {
        composeRule.setContent {
            ShoppingTheme(dynamicColor = false) {
                ListDetailTopBar(
                    title = "Compra semanal",
                    providerName = "Mercadona",
                    syncStatus = SyncStatus.IDLE,
                    onBackClick = {}
                )
            }
        }

        composeRule.onNodeWithText("Compra semanal · Mercadona").assertIsDisplayed()
    }

    @Test
    fun listDetailTopBar_displaysOnlyTitle_whenProviderIsBlank() {
        composeRule.setContent {
            ShoppingTheme(dynamicColor = false) {
                ListDetailTopBar(
                    title = "Compra semanal",
                    providerName = "",
                    syncStatus = SyncStatus.IDLE,
                    onBackClick = {}
                )
            }
        }

        composeRule.onNodeWithText("Compra semanal").assertIsDisplayed()
        composeRule.onAllNodesWithText("Compra semanal · Mercadona").assertCountEquals(0)
    }
}
