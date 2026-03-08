package com.alentadev.shopping.feature.sync.domain

import java.time.Instant
import javax.inject.Inject

enum class UpdatedAtComparison {
    REMOTE_NEWER,
    NOT_NEWER,
    PARSE_FAILURE
}

class UpdatedAtComparator @Inject constructor() {
    fun compare(remoteUpdatedAt: String, localUpdatedAt: String): UpdatedAtComparison {
        val remote = remoteUpdatedAt.toInstantOrNull() ?: return UpdatedAtComparison.PARSE_FAILURE
        val local = localUpdatedAt.toInstantOrNull() ?: return UpdatedAtComparison.PARSE_FAILURE
        return if (remote.isAfter(local)) {
            UpdatedAtComparison.REMOTE_NEWER
        } else {
            UpdatedAtComparison.NOT_NEWER
        }
    }

    fun isRemoteStrictlyNewer(remoteUpdatedAt: String, localUpdatedAt: String): Boolean {
        return compare(remoteUpdatedAt, localUpdatedAt) == UpdatedAtComparison.REMOTE_NEWER
    }

    private fun String.toInstantOrNull(): Instant? = runCatching { Instant.parse(this) }.getOrNull()
}
