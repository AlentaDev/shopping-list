package com.alentadev.shopping.feature.listdetail.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.key
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.alentadev.shopping.R
import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ListItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ManualItem

internal fun shouldRetryImageOnReconnect(
    wasConnected: Boolean,
    isConnected: Boolean,
    imageFailed: Boolean
): Boolean = !wasConnected && isConnected && imageFailed

internal class ImageReconnectRetryState(initiallyConnected: Boolean) {
    private var connected = initiallyConnected
    private var generation = 0
    private var retriedGeneration = -1
    private var failed = false
    fun requestStarted() = generation
    fun connectivityChanged(now: Boolean): Boolean {
        if (!connected && now) generation++
        connected = now
        if (now && failed && retriedGeneration != generation) {
            retriedGeneration = generation
            failed = false
            return true
        }
        return false
    }
    fun requestFailed(requestGeneration: Int, now: Boolean): Boolean {
        if (connectivityChanged(now)) return true
        if (now && requestGeneration < generation && retriedGeneration != generation) {
            retriedGeneration = generation
            failed = false
            return true
        }
        failed = true
        return false
    }
    fun requestSucceeded() { failed = false }
}

internal fun imageCacheKey(url: String, isConnected: Boolean): String = url

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ItemCard(
    item: ListItem,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    isConnected: Boolean = true
) {
    var showDetails by remember(item.id) { mutableStateOf(false) }
    val catalogItem = item as? CatalogItem
    Card(
        onClick = { if (catalogItem != null) showDetails = true },
        modifier = modifier.fillMaxWidth().testTag(
            if (catalogItem != null) "catalog-item-card" else "manual-item-card"
        ),
        colors = CardDefaults.cardColors(
            containerColor = if (item.checked) {
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            } else {
                MaterialTheme.colorScheme.surface
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Checkbox(
                checked = item.checked,
                onCheckedChange = onCheckedChange,
                modifier = Modifier.testTag("item-checkbox"),
                colors = CheckboxDefaults.colors(
                    checkedColor = MaterialTheme.colorScheme.primary
                )
            )

            if (catalogItem != null) {
                CatalogThumbnail(catalogItem, isConnected, Modifier.size(48.dp))
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = item.name,
                    style = MaterialTheme.typography.bodyLarge,
                    color = if (item.checked) {
                        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    },
                    textDecoration = if (item.checked) {
                        TextDecoration.LineThrough
                    } else {
                        null
                    },
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Text(
                    text = stringResource(R.string.item_quantity, item.qty),
                    style = MaterialTheme.typography.bodySmall,
                    color = if (item.checked) {
                        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    } else {
                        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    }
                )

                when (item) {
                    is CatalogItem -> item.note
                    is ManualItem -> item.note
                }?.let { note ->
                    if (note.isNotBlank()) {
                        Text(
                            text = note,
                            style = MaterialTheme.typography.bodySmall,
                            color = if (item.checked) {
                                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                            } else {
                                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            },
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }

            if (catalogItem?.price != null) {
                Column(
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text(
                        text = stringResource(R.string.item_price_detail, catalogItem.price, catalogItem.qty),
                        style = MaterialTheme.typography.bodySmall,
                        color = if (item.checked) {
                            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        } else {
                            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        }
                    )
                    Text(
                        text = stringResource(
                            R.string.item_subtotal,
                            catalogItem.getTotalPrice() ?: 0.0
                        ),
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (item.checked) {
                            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        },
                        textDecoration = if (item.checked) {
                            TextDecoration.LineThrough
                        } else {
                            null
                        }
                    )
                }
            }
        }
    }

    if (showDetails && catalogItem != null) {
        ModalBottomSheet(onDismissRequest = { showDetails = false }) {
            Column(
                Modifier.fillMaxWidth().padding(horizontal = 24.dp).padding(bottom = 32.dp)
                    .testTag("catalog-item-detail-sheet"),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                CatalogThumbnail(catalogItem, isConnected, Modifier.size(160.dp))
                Text(catalogItem.name, style = MaterialTheme.typography.headlineSmall)
                Text(
                    stringResource(R.string.item_quantity, catalogItem.qty),
                    modifier = Modifier.testTag("catalog-detail-quantity"),
                    style = MaterialTheme.typography.bodyLarge
                )
                catalogItem.price?.let { price ->
                    Text(stringResource(R.string.item_price_detail, price, catalogItem.qty), style = MaterialTheme.typography.bodyMedium)
                    Text(stringResource(R.string.item_subtotal, catalogItem.getTotalPrice() ?: 0.0), style = MaterialTheme.typography.titleMedium)
                }
                catalogItem.unitSize?.let { size ->
                    Text(
                        stringResource(R.string.item_unit_size, size, catalogItem.unitFormat.orEmpty()),
                        modifier = Modifier.testTag("catalog-detail-unit-size"),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                catalogItem.unitPrice?.let { price ->
                    Text(stringResource(R.string.item_unit_price, price), style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}

@Composable
private fun CatalogThumbnail(item: CatalogItem, isConnected: Boolean, modifier: Modifier = Modifier) {
    val url = item.thumbnail
    if (url == null) {
        Image(
            painter = painterResource(R.drawable.brand_logo),
            contentDescription = stringResource(R.string.item_thumbnail_description, item.name),
            modifier = modifier.clip(RoundedCornerShape(8.dp)).testTag("item-image-null-fallback"),
            contentScale = ContentScale.Crop
        )
        return
    }

    var imageFailed by remember(url) { mutableStateOf(false) }
    var imageLoaded by remember(url) { mutableStateOf(false) }
    val retryState = remember(url) { ImageReconnectRetryState(isConnected) }
    var retryAttempt by remember(url) { mutableIntStateOf(0) }
    val context = LocalContext.current
    LaunchedEffect(isConnected, url) {
        if (retryState.connectivityChanged(isConnected)) {
            imageFailed = false
            retryAttempt++
        }
    }

    key(retryAttempt) {
        val requestAttempt = retryAttempt
        val requestGeneration = remember(url, requestAttempt) { retryState.requestStarted() }
        val imageRequest = remember(url, retryAttempt) {
            ImageRequest.Builder(context)
                .data(url)
                // Keep the same cache identity in the card and detail sheet; only the request retries.
                .memoryCacheKey(imageCacheKey(url, isConnected))
                .diskCacheKey(imageCacheKey(url, isConnected))
                .build()
        }
        AsyncImage(
            model = imageRequest,
            contentDescription = stringResource(R.string.item_thumbnail_description, item.name),
            modifier = modifier.clip(RoundedCornerShape(8.dp)).testTag(
                when {
                    imageFailed -> "item-image-error-fallback"
                    imageLoaded -> "item-image-loaded-$url"
                    else -> "item-image-$url"
                }
            ),
            contentScale = ContentScale.Crop,
            error = painterResource(R.drawable.brand_logo),
            placeholder = painterResource(R.drawable.brand_logo),
            onError = {
                if (requestAttempt == retryAttempt) {
                    val shouldRetry = retryState.requestFailed(requestGeneration, isConnected)
                    imageFailed = !shouldRetry
                    imageLoaded = false
                    if (shouldRetry) retryAttempt++
                }
            },
            onSuccess = {
                if (requestAttempt == retryAttempt) {
                    retryState.requestSucceeded()
                    imageFailed = false
                    imageLoaded = true
                }
            }
        )
    }
}
