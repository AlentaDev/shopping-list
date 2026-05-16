package com.alentadev.shopping.ui

import android.content.pm.ActivityInfo
import android.view.WindowManager

object ActivityWindowPolicy {
    const val screenOrientation: Int = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    const val keepScreenOnFlags: Int = WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
}
