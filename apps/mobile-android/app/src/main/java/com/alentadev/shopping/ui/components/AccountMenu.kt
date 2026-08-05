package com.alentadev.shopping.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.alentadev.shopping.R
import java.util.Locale

internal fun accountInitials(name: String?): String? =
    name
        ?.trim()
        ?.split(Regex("\\s+"))
        ?.filter { it.isNotEmpty() }
        ?.take(2)
        ?.joinToString(separator = "") { it.first().uppercase(Locale.getDefault()) }
        ?.takeIf { it.length == 2 }
        ?: name
            ?.filterNot(Char::isWhitespace)
            ?.take(2)
            ?.uppercase(Locale.getDefault())
        ?.ifEmpty { null }

@Composable
internal fun AccountMenu(
    userName: String?,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier
) {
    var isOpen by remember { mutableStateOf(false) }

    Box(modifier = modifier) {
        IconButton(
            onClick = { isOpen = true },
            modifier = Modifier
                .padding(end = 8.dp)
                .size(48.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = accountInitials(userName)
                        ?: stringResource(R.string.lists_account_initial_fallback),
                    color = MaterialTheme.colorScheme.onPrimary,
                    style = MaterialTheme.typography.labelMedium
                )
            }
        }
        DropdownMenu(
            expanded = isOpen,
            onDismissRequest = { isOpen = false }
        ) {
            DropdownMenuItem(
                text = {
                    Text(
                        text = stringResource(R.string.logout_button),
                        color = MaterialTheme.colorScheme.error
                    )
                },
                onClick = {
                    isOpen = false
                    onLogout()
                }
            )
        }
    }
}
