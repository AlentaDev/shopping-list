package com.alentadev.shopping.ui.navigation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.alentadev.shopping.feature.sync.application.AppSessionSyncObserver
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class AppSessionSyncViewModel @Inject constructor(
    appSessionSyncObserver: AppSessionSyncObserver
) : ViewModel() {

    init {
        appSessionSyncObserver.start(viewModelScope)
    }
}
