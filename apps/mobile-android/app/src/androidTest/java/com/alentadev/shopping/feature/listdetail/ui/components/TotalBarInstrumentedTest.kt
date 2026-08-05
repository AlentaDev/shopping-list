package com.alentadev.shopping.feature.listdetail.ui.components

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.alentadev.shopping.ui.theme.ShoppingTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class TotalBarInstrumentedTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun totalBar_groupsProgressAndTotal_andKeepsCompletionButtonCompact() {
        var completed = false

        composeRule.setContent {
            ShoppingTheme(dynamicColor = false) {
                TotalBar(
                    total = 12.34,
                    progress = ListProgress(completed = 17, total = 34),
                    onCompleteList = { completed = true }
                )
            }
        }

        val counter = composeRule.onNodeWithTag("total-bar-progress-count")
        val pill = composeRule.onNodeWithTag("total-bar-progress-pill")
        val totalLabel = composeRule.onNodeWithTag("total-bar-total-label")
        val totalValue = composeRule.onNodeWithTag("total-bar-total-value")
        val completeButton = composeRule.onNodeWithTag("total-bar-complete-button")

        counter.assertIsDisplayed()
        pill.assertIsDisplayed()
        totalLabel.assertIsDisplayed()
        totalValue.assertIsDisplayed()
        completeButton.assertIsDisplayed()

        composeRule.runOnIdle {
            val summaryCenterY = counter.fetchSemanticsNode().boundsInRoot.center.y
            val pillBounds = pill.fetchSemanticsNode().boundsInRoot
            val totalLabelBounds = totalLabel.fetchSemanticsNode().boundsInRoot
            val totalValueBounds = totalValue.fetchSemanticsNode().boundsInRoot
            val completeButtonBounds = completeButton.fetchSemanticsNode().boundsInRoot

            assertEquals(summaryCenterY, pill.fetchSemanticsNode().boundsInRoot.center.y, 0.5f)
            assertEquals(summaryCenterY, totalLabelBounds.center.y, 0.5f)
            assertEquals(summaryCenterY, totalValueBounds.center.y, 0.5f)
            assertTrue(totalLabelBounds.left - pillBounds.right <= 16f)
            assertTrue(totalValueBounds.left - totalLabelBounds.right >= 6f)
            assertTrue(completeButtonBounds.top > summaryCenterY)
            assertEquals(40f, completeButtonBounds.height, 0.5f)
        }

        completeButton.performClick()
        assertTrue(completed)
    }
}
