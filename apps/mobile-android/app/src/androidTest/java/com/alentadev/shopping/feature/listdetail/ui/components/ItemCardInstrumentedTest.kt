package com.alentadev.shopping.feature.listdetail.ui.components

import android.graphics.Bitmap
import android.net.Uri
import android.graphics.Color
import android.graphics.drawable.BitmapDrawable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import coil.ImageLoader
import coil.compose.LocalImageLoader
import coil.decode.DataSource
import coil.fetch.DrawableResult
import coil.fetch.Fetcher
import coil.request.Options
import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ManualItem
import com.alentadev.shopping.ui.theme.ShoppingTheme
import java.io.IOException
import java.util.concurrent.atomic.AtomicInteger
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ItemCardInstrumentedTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun catalogItemClickOpensInformationalSheetWithSnapshotValues() {
        composeRule.setContent {
            ShoppingTheme(dynamicColor = false) {
                ItemCard(
                    item = CatalogItem(
                        id = "1", name = "Leche", qty = 2.0, checked = false,
                        updatedAt = "2026-01-01", sourceProductId = "p1",
                        thumbnail = null, price = 1.5, unitSize = 1.0,
                        unitFormat = "L", unitPrice = 1.5
                    ),
                    onCheckedChange = {}
                )
            }
        }

        composeRule.onNodeWithTag("catalog-item-card").performClick()
        composeRule.onNodeWithTag("catalog-item-detail-sheet").assertIsDisplayed()
        composeRule.onNodeWithTag("catalog-detail-quantity").assertIsDisplayed()
        composeRule.onNodeWithTag("catalog-detail-unit-size").assertIsDisplayed()
    }

    @Test
    fun nullCatalogImageUsesBrandLogoFallback() {
        composeRule.setContent {
            ShoppingTheme(dynamicColor = false) {
                ItemCard(
                    item = CatalogItem("1", "Leche", 1.0, false, "2026-01-01", sourceProductId = "p1"),
                    onCheckedChange = {}
                )
            }
        }

        composeRule.onNodeWithTag("item-image-null-fallback", useUnmergedTree = true).assertIsDisplayed()
    }

    @Test
    fun failedImageIsRetriedAfterReconnectUsingCoilLoader() {
        val fetcherFactory = CountingImageFetcherFactory(failFirstRequest = true)
        val imageLoader = createTestImageLoader(fetcherFactory)
        val connected = mutableStateOf(false)
        try {
            composeRule.setContent {
                CompositionLocalProvider(LocalImageLoader provides imageLoader) {
                    ShoppingTheme(dynamicColor = false) {
                        ItemCard(
                            item = catalogItemWithImage(),
                            onCheckedChange = {},
                            isConnected = connected.value
                        )
                    }
                }
            }

            composeRule.waitUntil(5_000) {
                fetcherFactory.requestCount.get() == 1 &&
                    composeRule.onAllNodesWithTag("item-image-error-fallback", useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty()
            }
            composeRule.runOnIdle { connected.value = true }
            composeRule.waitUntil(5_000) {
                fetcherFactory.requestCount.get() == 2 &&
                    composeRule.onAllNodesWithTag("item-image-loaded-$TEST_IMAGE_URL", useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty()
            }
            assertEquals("first failed request plus one reconnect retry", 2, fetcherFactory.requestCount.get())
        } finally {
            imageLoader.shutdown()
        }
    }

    @Test
    fun successfulImageIsReusedFromCoilCacheWhenOpeningSheet() {
        val fetcherFactory = CountingImageFetcherFactory(failFirstRequest = false)
        val imageLoader = createTestImageLoader(fetcherFactory)
        try {
            composeRule.setContent {
                CompositionLocalProvider(LocalImageLoader provides imageLoader) {
                    ShoppingTheme(dynamicColor = false) {
                        ItemCard(item = catalogItemWithImage(), onCheckedChange = {})
                    }
                }
            }
            composeRule.waitUntil(5_000) {
                fetcherFactory.requestCount.get() == 1 &&
                    composeRule.onAllNodesWithTag(
                        "item-image-loaded-$TEST_IMAGE_URL", useUnmergedTree = true
                    ).fetchSemanticsNodes().size == 1
            }
            composeRule.onNodeWithTag("catalog-item-card").performClick()
            composeRule.onNodeWithTag("catalog-item-detail-sheet").assertIsDisplayed()
            composeRule.waitUntil(5_000) {
                composeRule.onAllNodesWithTag(
                    "item-image-loaded-$TEST_IMAGE_URL", useUnmergedTree = true
                ).fetchSemanticsNodes().size >= 2
            }
            assertEquals("card and sheet use one successful fetch", 1, fetcherFactory.requestCount.get())
        } finally {
            imageLoader.shutdown()
        }
    }

    @Test
    fun checkboxStillTogglesWithoutOpeningInformationalSheet() {
        var checked = false
        composeRule.setContent {
            ShoppingTheme(dynamicColor = false) {
                ItemCard(
                    item = CatalogItem("1", "Leche", 1.0, false, "2026-01-01", sourceProductId = "p1"),
                    onCheckedChange = { checked = it }
                )
            }
        }

        composeRule.onNodeWithTag("item-checkbox").performClick()
        composeRule.runOnIdle { assertTrue(checked) }
        composeRule.onAllNodesWithTag("catalog-item-detail-sheet").assertCountEquals(0)
    }

    @Test
    fun manualItemClickDoesNotOpenCatalogDetail() {
        composeRule.setContent {
            ShoppingTheme(dynamicColor = false) {
                ItemCard(
                    item = ManualItem("m1", "Pan", 1.0, false, "2026-01-01"),
                    onCheckedChange = {}
                )
            }
        }

        composeRule.onNodeWithTag("manual-item-card").performClick()
        composeRule.onAllNodesWithTag("catalog-item-detail-sheet").assertCountEquals(0)
    }

    private fun catalogItemWithImage() = CatalogItem(
        id = "1", name = "Product one", qty = 1.0, checked = false,
        updatedAt = "2026-01-01", thumbnail = TEST_IMAGE_URL, sourceProductId = "p1"
    )

    private fun createTestImageLoader(factory: CountingImageFetcherFactory): ImageLoader =
        ImageLoader.Builder(InstrumentationRegistry.getInstrumentation().targetContext)
            .components { add(factory) }
            .build()

    private companion object {
        const val TEST_IMAGE_URL = "test-image://product/1"
    }
}

private class CountingImageFetcherFactory(
    private val failFirstRequest: Boolean
) : Fetcher.Factory<Uri> {
    val requestCount = AtomicInteger(0)

    override fun create(data: Uri, options: Options, imageLoader: ImageLoader): Fetcher? =
        if (data.scheme == "test-image") {
            CountingImageFetcher(requestCount, failFirstRequest)
        } else {
            null
        }
}

private class CountingImageFetcher(
    private val requestCount: AtomicInteger,
    private val failFirstRequest: Boolean
) : Fetcher {
    override suspend fun fetch(): coil.fetch.FetchResult {
        val requestNumber = requestCount.incrementAndGet()
        if (failFirstRequest && requestNumber == 1) throw IOException("intentional fixture failure")
        val bitmap = Bitmap.createBitmap(512, 512, Bitmap.Config.ARGB_8888).apply { eraseColor(Color.GREEN) }
        return DrawableResult(
            drawable = BitmapDrawable(android.content.res.Resources.getSystem(), bitmap),
            isSampled = false,
            dataSource = DataSource.DISK
        )
    }
}
