package com.alentadev.shopping.feature.listdetail.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.alentadev.shopping.R
import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ListItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ManualItem

/**
 * Componente de tarjeta para mostrar un item de la lista
 *
 * Características:
 * - Checkbox para marcar/desmarcar
 * - Thumbnail (si es CatalogItem)
 * - Nombre del producto
 * - Precio x Cantidad = Subtotal
 * - Estilo checked: texto tachado leve + color gris
 *
 * @param item Item a mostrar (puede ser CatalogItem o ManualItem)
 * @param onCheckedChange Callback cuando se marca/desmarca
 * @param modifier Modificador opcional
 */
@Composable
fun ItemCard(
    item: ListItem,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
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
            // Checkbox
            Checkbox(
                checked = item.checked,
                onCheckedChange = onCheckedChange,
                colors = CheckboxDefaults.colors(
                    checkedColor = MaterialTheme.colorScheme.primary
                )
            )

            // Thumbnail (solo para CatalogItem)
            if (item is CatalogItem && item.thumbnail != null) {
                AsyncImage(
                    model = item.thumbnail,
                    contentDescription = stringResource(R.string.item_thumbnail_description, item.name),
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(8.dp)),
                    contentScale = ContentScale.Crop
                )
            } else if (item is CatalogItem) {
                // Placeholder cuando no hay thumbnail
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "🛒",
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }

            // Información del producto
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                // Nombre
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

                // Cantidad
                Text(
                    text = stringResource(R.string.item_quantity, item.qty),
                    style = MaterialTheme.typography.bodySmall,
                    color = if (item.checked) {
                        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    } else {
                        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    }
                )

                // Nota (si existe)
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

            // Precio x Cantidad = Subtotal (solo para CatalogItem con precio)
            if (item is CatalogItem && item.price != null) {
                Column(
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text(
                        text = stringResource(R.string.item_price_detail, item.price, item.qty),
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
                            item.getTotalPrice() ?: 0.0
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
}


