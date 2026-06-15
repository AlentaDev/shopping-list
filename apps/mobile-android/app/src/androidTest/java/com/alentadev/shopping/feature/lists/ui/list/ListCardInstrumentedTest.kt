package com.alentadev.shopping.feature.lists.ui.list

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.alentadev.shopping.feature.lists.domain.entity.ListStatus
import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.ui.theme.ShoppingTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ListCardInstrumentedTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun listCard_displaysProviderAlongsideTitle_whenProviderExists() {
        val list = ShoppingList(
            id = "list-1",
            title = "Compra semanal",
            status = ListStatus.ACTIVE,
            updatedAt = 0L,
            itemCount = 3,
            providerName = "Mercadona"
        )

        composeRule.setContent {
            ShoppingTheme(dynamicColor = false) {
                ListCard(list = list)
            }
        }

        composeRule.onNodeWithText("Compra semanal · Mercadona").assertIsDisplayed()
    }

    @Test
    fun listCard_displaysOnlyTitle_whenProviderIsBlank() {
        val list = ShoppingList(
            id = "list-1",
            title = "Compra semanal",
            status = ListStatus.ACTIVE,
            updatedAt = 0L,
            itemCount = 3,
            providerName = ""
        )

        composeRule.setContent {
            ShoppingTheme(dynamicColor = false) {
                ListCard(list = list)
            }
        }

        composeRule.onNodeWithText("Compra semanal").assertIsDisplayed()
        composeRule.onAllNodesWithText("Compra semanal · Mercadona").assertCountEquals(0)
    }
}
