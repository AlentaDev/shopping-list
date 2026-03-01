package com.alentadev.shopping.feature.listdetail.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
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
fun TotalBar(
    total: Double,
    modifier: Modifier = Modifier,
    onCompleteList: (() -> Unit)? = null
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shadowElevation = 8.dp,
        color = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Divider superior
            HorizontalDivider()

            // Total
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = stringResource(R.string.detail_total_label),
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = stringResource(R.string.detail_total_value, total),
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            // Botón Completar Lista (FASE 4)
            if (onCompleteList != null) {
                Button(
                    onClick = onCompleteList,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(text = stringResource(R.string.detail_complete_button))
                }
            }
        }
    }
}


