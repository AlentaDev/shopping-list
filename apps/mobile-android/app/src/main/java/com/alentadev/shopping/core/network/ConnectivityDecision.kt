package com.alentadev.shopping.core.network

/**
 * Resultado de la decisión efectiva de conectividad cuando el Flow reactivo puede estar desfasado.
 */
data class ConnectivityDecision(
    val flowConnected: Boolean,
    val currentConnected: Boolean,
    val effectiveConnected: Boolean
)

fun NetworkMonitor.resolveConnectivity(flowConnected: Boolean): ConnectivityDecision {
    val currentConnected = isCurrentlyConnected()
    return ConnectivityDecision(
        flowConnected = flowConnected,
        currentConnected = currentConnected,
        effectiveConnected = flowConnected || currentConnected
    )
}
