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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.alentadev.shopping.R
import com.alentadev.shopping.feature.listdetail.ui.components.ItemCard
import com.alentadev.shopping.feature.listdetail.ui.components.TotalBar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ListDetailScreen(
    onBackClick: () -> Unit,
    onListCompleted: () -> Unit,
    viewModel: DetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val isConnected by viewModel.isConnected.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    val syncMessage = stringResource(R.string.background_sync_snackbar)

    LaunchedEffect(viewModel) {
        viewModel.syncSnackbarEvents.collect { event ->
            when (event) {
                SyncSnackbarEvent.Show -> snackbarHostState.showSnackbar(
                    message = syncMessage,
                    withDismissAction = false
                )
                SyncSnackbarEvent.Hide -> snackbarHostState.currentSnackbarData?.dismiss()
            }
        }
    }

    LaunchedEffect(viewModel) {
        viewModel.uiEvents.collect { event ->
            if (event is DetailUiEvent.ListCompleted) {
                onListCompleted()
            }
        }
    }

    Scaffold(
        snackbarHost = {
            SnackbarHost(hostState = snackbarHostState) { data ->
                Snackbar(
                    snackbarData = data,
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        },
        topBar = {
            when (val state = uiState) {
                is ListDetailUiState.Success -> {
                    TopAppBar(
                        title = {
                            Box(modifier = Modifier.fillMaxWidth()) {
                                Text(state.listDetail.title)
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
            is ListDetailUiState.Loading -> LoadingState(modifier = Modifier.padding(paddingValues))
            is ListDetailUiState.Success -> {
                SuccessState(
                    state = state,
                    isConnected = isConnected,
                    onItemCheckedChange = { itemId, checked -> viewModel.toggleItemCheck(itemId, checked) },
                    onRefresh = { viewModel.loadListDetail() },
                    onCompleteListClick = { viewModel.onCompleteListRequested() },
                    modifier = Modifier.padding(paddingValues)
                )

                if (state.showCompleteConfirmation) {
                    ConfirmCompleteDialog(
                        isCompleting = state.isCompleting,
                        onConfirm = { viewModel.confirmCompleteList() },
                        onDismiss = { viewModel.dismissCompleteDialog() }
                    )
                }
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

@Composable
private fun LoadingState(modifier: Modifier = Modifier) { /* unchanged */
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
            CircularProgressIndicator()
            Text(text = stringResource(R.string.detail_loading), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
        }
    }
}

@Composable
private fun SuccessState(
    state: ListDetailUiState.Success,
    isConnected: Boolean,
    onItemCheckedChange: (String, Boolean) -> Unit,
    onRefresh: () -> Unit,
    onCompleteListClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            if (!isConnected) {
                OfflineBanner(modifier = Modifier.fillMaxWidth())
            }

            if (state.hasPermanentRefreshError) {
                PermanentErrorBanner(modifier = Modifier.fillMaxWidth())
            }

            if (state.hasRemoteChanges) {
                RemoteChangesBanner(onRefresh = onRefresh, modifier = Modifier.fillMaxWidth())
            }

            state.completeListError?.let { error ->
                CompleteListErrorBanner(error = error, modifier = Modifier.fillMaxWidth())
            }

            LazyColumn(
                modifier = Modifier.fillMaxWidth().weight(1f),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(items = state.listDetail.items, key = { it.id }) { item ->
                    ItemCard(item = item, onCheckedChange = { checked -> onItemCheckedChange(item.id, checked) })
                }
            }

            TotalBar(total = state.total, onCompleteList = onCompleteListClick)
        }
    }
}

@Composable
private fun OfflineBanner(modifier: Modifier = Modifier) {
    Surface(modifier = modifier, color = MaterialTheme.colorScheme.secondaryContainer, shadowElevation = 4.dp) {
        Row(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(imageVector = Icons.Default.Info, contentDescription = null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.onSecondaryContainer)
            Text(text = stringResource(R.string.detail_offline_banner), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSecondaryContainer, modifier = Modifier.weight(1f))
        }
    }
}

@Composable
private fun CompleteListErrorBanner(error: CompleteListError, modifier: Modifier = Modifier) {
    val messageRes = when (error) {
        CompleteListError.OFFLINE -> R.string.detail_complete_error_offline
        CompleteListError.NO_CONNECTION -> R.string.detail_complete_error_no_connection
        CompleteListError.INVALID_TRANSITION -> R.string.detail_complete_error_invalid_transition
        CompleteListError.UNAUTHORIZED -> R.string.detail_complete_error_unauthorized
        CompleteListError.FORBIDDEN -> R.string.detail_complete_error_forbidden
        CompleteListError.NOT_FOUND -> R.string.detail_complete_error_not_found
        CompleteListError.LIST_NOT_FOUND -> R.string.detail_complete_error_list_not_found
        CompleteListError.SERVER_ERROR,
        CompleteListError.UNKNOWN -> R.string.detail_complete_error_server
    }

    Surface(modifier = modifier, color = MaterialTheme.colorScheme.errorContainer, shadowElevation = 4.dp) {
        Text(
            text = stringResource(messageRes),
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            color = MaterialTheme.colorScheme.onErrorContainer,
            style = MaterialTheme.typography.labelMedium
        )
    }
}

@Composable
private fun PermanentErrorBanner(modifier: Modifier = Modifier) {
    Surface(modifier = modifier, color = MaterialTheme.colorScheme.errorContainer, shadowElevation = 4.dp) {
        Text(
            text = stringResource(R.string.detail_permanent_error_banner),
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            color = MaterialTheme.colorScheme.onErrorContainer,
            style = MaterialTheme.typography.labelMedium
        )
    }
}

@Composable
private fun RemoteChangesBanner(onRefresh: () -> Unit, modifier: Modifier = Modifier) { /* unchanged */
    Surface(modifier = modifier, color = MaterialTheme.colorScheme.errorContainer, shadowElevation = 4.dp) {
        Row(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(imageVector = Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.onErrorContainer)
            Text(text = stringResource(R.string.detail_remote_changes_banner), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onErrorContainer, modifier = Modifier.weight(1f))
            TextButton(onClick = onRefresh, modifier = Modifier.wrapContentWidth(Alignment.End)) {
                Text(text = stringResource(R.string.detail_refresh_button), style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

@Composable
private fun ErrorState(message: String, onRetry: () -> Unit, modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.padding(32.dp)) {
            Text(text = stringResource(R.string.detail_error), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.error)
            Text(text = message, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
            Button(onClick = onRetry) { Text(text = stringResource(R.string.detail_retry_button)) }
        }
    }
}
