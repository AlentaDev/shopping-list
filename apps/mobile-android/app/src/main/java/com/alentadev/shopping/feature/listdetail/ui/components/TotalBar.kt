package com.alentadev.shopping.feature.listdetail.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.alentadev.shopping.R

/**
 * Barra sticky inferior con el total de la lista
 *
 * Características:
 * - Muestra el total calculado en EUR
 * - Botón "Completar lista" (TODO: implementar en FASE 4)
 * - Sticky al bottom de la pantalla
 *
 * @param total Total en EUR de items marcados
 * @param onCompleteList Callback cuando se presiona "Completar lista" (para FASE 4)
 * @param modifier Modificador opcional
 */
@Composable
internal fun TotalBar(
    total: Double,
    progress: ListProgress,
    modifier: Modifier = Modifier,
    onCompleteList: (() -> Unit)? = null,
    isCompleteEnabled: Boolean = true
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shadowElevation = 8.dp,
        color = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = stringResource(R.string.detail_progress_count, progress.completed, progress.total),
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.Black,
                    modifier = Modifier.testTag("total-bar-progress-count")

                )
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(12.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer)
                        .testTag("total-bar-progress-pill")
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(progress.fraction)
                            .fillMaxHeight()
                            .background(MaterialTheme.colorScheme.primary)
                    )
                }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = stringResource(R.string.detail_total_label),
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.Black,
                        modifier = Modifier.testTag("total-bar-total-label")
                    )
                    Text(
                        text = stringResource(R.string.detail_total_value, total),
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.testTag("total-bar-total-value")
                    )
                }
            }

            if (onCompleteList != null) {
                Button(
                    onClick = onCompleteList,
                    enabled = isCompleteEnabled,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(36.dp)
                        .testTag("total-bar-complete-button")
                ) {
                    Text(text = stringResource(R.string.detail_complete_button))
                }
            }
        }
    }
}
