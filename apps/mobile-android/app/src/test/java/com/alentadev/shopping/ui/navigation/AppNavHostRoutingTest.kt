package com.alentadev.shopping.ui.navigation

import com.alentadev.shopping.feature.auth.ui.navigation.LOGIN_ROUTE
import com.alentadev.shopping.feature.auth.ui.navigation.LOGIN_ROUTE_PATTERN
import com.alentadev.shopping.feature.auth.ui.navigation.loginRoute
import com.alentadev.shopping.feature.lists.ui.navigation.ACTIVE_LISTS_ROUTE
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AppNavHostRoutingTest {

    @Test
    fun `resolve bootstrap destination returns active lists for authenticated`() {
        assertEquals(
            ACTIVE_LISTS_ROUTE,
            resolveBootstrapDestination(AuthBootstrapState.Authenticated)
        )
    }

    @Test
    fun `resolve bootstrap destination returns login for unauthenticated`() {
        assertEquals(
            loginRoute(recoverableMode = false),
            resolveBootstrapDestination(AuthBootstrapState.Unauthenticated)
        )
    }

    @Test
    fun `resolve bootstrap destination returns recoverable login for offline recoverable`() {
        assertEquals(
            loginRoute(recoverableMode = true),
            resolveBootstrapDestination(AuthBootstrapState.OfflineRecoverable)
        )
    }

    @Test
    fun `resolve bootstrap destination returns null while unknown or checking`() {
        assertEquals(null, resolveBootstrapDestination(AuthBootstrapState.Unknown))
        assertEquals(null, resolveBootstrapDestination(AuthBootstrapState.Checking))
    }

    @Test
    fun `build authenticated navigation command clears bootstrap and login from back stack`() {
        val command = buildAuthenticatedNavigationCommand()

        assertEquals(ACTIVE_LISTS_ROUTE, command.route)
        assertEquals(LOGIN_ROUTE_PATTERN, command.clearLoginRoute)
        assertEquals(BOOTSTRAP_ROUTE, command.clearBootstrapRoute)
        assertTrue(command.launchSingleTop)
    }

    @Test
    fun `login route defaults to plain login route when not recoverable`() {
        assertEquals("$LOGIN_ROUTE?recoverable=false", loginRoute(recoverableMode = false))
    }
}
