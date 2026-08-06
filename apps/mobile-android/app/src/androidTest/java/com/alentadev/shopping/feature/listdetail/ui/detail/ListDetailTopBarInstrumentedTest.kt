package com.alentadev.shopping.feature.listdetail.ui.detail

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
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
    fun listDetailTopBar_displaysTitleBelowProviderHeader() {
        composeRule.setContent {
            ShoppingTheme(dynamicColor = false) {
                ListDetailTopBar(
                    title = "Compra semanal",
                    providerName = "Mercadona",
                    syncStatus = SyncStatus.IDLE,
                    onBackClick = {},
                    userName = "Juan User",
                    onLogout = {}
                )
            }
        }

        composeRule.onNodeWithText("Compra semanal").assertIsDisplayed()
    }

    @Test
    fun listDetailTopBar_displaysOnlyTitle_whenProviderIsBlank() {
        composeRule.setContent {
            ShoppingTheme(dynamicColor = false) {
                ListDetailTopBar(
                    title = "Compra semanal",
                    providerName = "",
                    syncStatus = SyncStatus.IDLE,
                    onBackClick = {},
                    userName = null,
                    onLogout = {}
                )
            }
        }

        composeRule.onNodeWithText("Compra semanal").assertIsDisplayed()
        composeRule.onAllNodesWithText("Compra semanal · Mercadona").assertCountEquals(0)
    }

    @Test
    fun listDetailTopBar_keepsLongTitleInDedicatedCenteredRow() {
        val title = "Compra semanal con productos para desayuno, almuerzo y cena"

        composeRule.setContent {
            ShoppingTheme(dynamicColor = false) {
                ListDetailTopBar(
                    title = title,
                    providerName = "Mercadona",
                    syncStatus = SyncStatus.IDLE,
                    onBackClick = {},
                    userName = "Juan User",
                    onLogout = {}
                )
            }
        }

        composeRule.onNodeWithTag("list-detail-title").assertIsDisplayed()
    }
}
