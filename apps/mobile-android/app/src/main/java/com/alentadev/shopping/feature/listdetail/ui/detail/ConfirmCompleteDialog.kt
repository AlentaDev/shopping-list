package com.alentadev.shopping.feature.listdetail.ui.detail

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.alentadev.shopping.R

@Composable
fun ConfirmCompleteDialog(
    isCompleting: Boolean,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = {
            if (!isCompleting) {
                onDismiss()
            }
        },
        title = {
            Text(text = stringResource(R.string.detail_complete_dialog_title))
        },
        text = {
            Text(text = stringResource(R.string.detail_complete_dialog_message))
        },
        confirmButton = {
            TextButton(
                onClick = onConfirm,
                enabled = !isCompleting
            ) {
                if (isCompleting) {
                    CircularProgressIndicator()
                } else {
                    Text(text = stringResource(R.string.detail_complete_dialog_confirm))
                }
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isCompleting
            ) {
                Text(text = stringResource(R.string.detail_complete_dialog_cancel))
            }
        }
    )
}
