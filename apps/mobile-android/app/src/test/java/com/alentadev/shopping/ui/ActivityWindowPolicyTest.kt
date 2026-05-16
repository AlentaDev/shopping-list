package com.alentadev.shopping.ui

import android.content.pm.ActivityInfo
import android.view.WindowManager
import org.junit.Assert.assertEquals
import org.junit.Test

class ActivityWindowPolicyTest {
    @Test
    fun `locks the app in portrait orientation`() {
        assertEquals(
            ActivityInfo.SCREEN_ORIENTATION_PORTRAIT,
            ActivityWindowPolicy.screenOrientation
        )
    }

    @Test
    fun `keeps the screen awake while the app is in foreground`() {
        assertEquals(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            ActivityWindowPolicy.keepScreenOnFlags
        )
    }
}
