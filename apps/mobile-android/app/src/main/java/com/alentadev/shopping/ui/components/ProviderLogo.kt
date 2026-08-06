package com.alentadev.shopping.ui.components

import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.alentadev.shopping.R
import java.util.Locale

internal fun providerLogoResource(providerName: String): Int? = when (
    providerName.trim().lowercase(Locale.ROOT)
) {
    "mercadona" -> R.drawable.provider_mercadona_logo
    "bonpreu esclat", "bonpreuesclat" -> R.drawable.provider_bonpreuesclat_logo
    else -> null
}

@Composable
internal fun ProviderLogo(
    providerName: String,
    modifier: Modifier = Modifier
        .width(64.dp)
        .height(48.dp)
) {
    val logoResource = providerLogoResource(providerName)
    var logoLoadFailed by remember(logoResource) { mutableStateOf(false) }

    if (logoResource != null && !logoLoadFailed) {
        AsyncImage(
            model = ImageRequest.Builder(LocalContext.current)
                .data(logoResource)
                .build(),
            contentDescription = null,
            modifier = modifier,
            contentScale = ContentScale.Fit,
            onError = { logoLoadFailed = true }
        )
    } else if (providerName.isNotBlank()) {
        Text(
            text = providerName,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = modifier
        )
    }
}
