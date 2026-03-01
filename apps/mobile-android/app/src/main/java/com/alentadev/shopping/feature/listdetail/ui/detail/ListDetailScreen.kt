package com.alentadev.shopping.feature.listdetail.ui.detail
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.alentadev.shopping.R
import com.alentadev.shopping.feature.listdetail.ui.components.ItemCard
import com.alentadev.shopping.feature.listdetail.ui.components.TotalBar

/**
 * Pantalla de detalle de lista
 *
 * Características:
 * - Lista vertical de items con LazyColumn
 * - Cada item con checkbox, thumbnail, nombre, precio
 * - Barra sticky inferior con total
 * - Banners informativos: sin conexión, cambios remotos
 * - Estados: Loading, Success, Error
 * - Navegación: botón back en top bar
 * - Offline-first: funciona sin conexión usando caché local
 *
 * @param onBackClick Callback para navegación hacia atrás
 * @param viewModel ViewModel con lógica de negocio (inyectado por Hilt)
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ListDetailScreen(
    onBackClick: () -> Unit,
    viewModel: DetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val isConnected by viewModel.isConnected.collectAsState()

    Scaffold(
        topBar = {
            when (val state = uiState) {
                is ListDetailUiState.Success -> {
                    TopAppBar(
                        title = {
                            Box(modifier = Modifier.fillMaxWidth()) {
                                Text(state.listDetail.title)
                                // Mostrar spinner si está sincronizando
                                if (state.syncStatus == SyncStatus.SYNCING) {
                                    CircularProgressIndicator(
                                        modifier = Modifier
                                            .size(20.dp)
                                            .align(Alignment.CenterEnd),
                                        strokeWidth = 2.dp
                                    )
                                }
                            }
                        },
                        navigationIcon = {
                            IconButton(onClick = onBackClick) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                    contentDescription = stringResource(R.string.detail_back_button)
                                )
                            }
                        }
                    )
                }
                else -> {
                    TopAppBar(
                        title = { Text(stringResource(R.string.detail_title)) },
                        navigationIcon = {
                            IconButton(onClick = onBackClick) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                    contentDescription = stringResource(R.string.detail_back_button)
                                )
                            }
                        }
                    )
                }
            }
        }
    ) { paddingValues ->
        when (val state = uiState) {
            is ListDetailUiState.Loading -> {
                LoadingState(modifier = Modifier.padding(paddingValues))
            }
            is ListDetailUiState.Success -> {
                SuccessState(
                    state = state,
                    isConnected = isConnected,
                    onItemCheckedChange = { itemId, checked ->
                        viewModel.toggleItemCheck(itemId, checked)
                    },
                    onRefresh = {
                        viewModel.loadListDetail()
                    },
                    modifier = Modifier.padding(paddingValues)
                )
            }
            is ListDetailUiState.Error -> {
                ErrorState(
                    message = state.message,
                    onRetry = { viewModel.retry() },
                    modifier = Modifier.padding(paddingValues)
                )
            }
        }
    }
}

/**
 * Estado de carga
 */
@Composable
private fun LoadingState(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CircularProgressIndicator()
            Text(
                text = stringResource(R.string.detail_loading),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
    }
}

/**
 * Estado exitoso con lista de items y banners informativos
 */
@Composable
private fun SuccessState(
    state: ListDetailUiState.Success,
    isConnected: Boolean,
    onItemCheckedChange: (String, Boolean) -> Unit,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Banner: Sin conexión (usando cache local)
            if (state.fromCache) {
                OfflineBanner(
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // Banner: Cambios remotos detectados
            if (state.hasRemoteChanges) {
                RemoteChangesBanner(
                    onRefresh = onRefresh,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // Lista de items
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(
                    items = state.listDetail.items,
                    key = { it.id }
                ) { item ->
                    ItemCard(
                        item = item,
                        onCheckedChange = { checked ->
                            onItemCheckedChange(item.id, checked)
                        }
                    )
                }
            }

            // Barra de total (sticky al bottom)
            TotalBar(
                total = state.total,
                onCompleteList = null // TODO: FASE 4
            )
        }
    }
}

/**
 * Banner de desconexión (usando caché local)
 */
@Composable
private fun OfflineBanner(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.secondaryContainer,
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Info,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = MaterialTheme.colorScheme.onSecondaryContainer
            )
            Text(
                text = stringResource(R.string.detail_offline_banner),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSecondaryContainer,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

/**
 * Banner de cambios remotos detectados
 */
@Composable
private fun RemoteChangesBanner(
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.errorContainer,
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = MaterialTheme.colorScheme.onErrorContainer
            )
            Text(
                text = stringResource(R.string.detail_remote_changes_banner),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onErrorContainer,
                modifier = Modifier.weight(1f)
            )
            TextButton(
                onClick = onRefresh,
                modifier = Modifier.wrapContentWidth(Alignment.End)
            ) {
                Text(
                    text = stringResource(R.string.detail_refresh_button),
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}

/**
 * Estado de error
 */
@Composable
private fun ErrorState(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.padding(32.dp)
        ) {
            Text(
                text = stringResource(R.string.detail_error),
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.error
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
            Button(onClick = onRetry) {
                Text(text = stringResource(R.string.detail_retry_button))
            }
        }
    }
}

