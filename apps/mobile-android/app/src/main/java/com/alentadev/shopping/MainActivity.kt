package com.alentadev.shopping

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.lifecycleScope
import com.alentadev.shopping.network.LoginRequest
import com.alentadev.shopping.network.RetrofitClient
import com.alentadev.shopping.ui.theme.ShoppingTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Inicializar Retrofit + OkHttp con cookies y authenticator
        RetrofitClient.initialize(this)

        // Ejemplo: Realizar login (descomentar para probar)
        // loginExample()

        setContent {
            ShoppingTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Greeting(
                        name = "Shopping List App",
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }

    private fun loginExample() {
        lifecycleScope.launch {
            try {
                val apiService = RetrofitClient.getApiService()
                val response = apiService.login(
                    LoginRequest(
                        email = "test@example.com",
                        password = "password123"
                    )
                )

                if (response.isSuccessful) {
                    Log.d("MainActivity", "Login successful: ${response.body()}")
                    // Las cookies se guardan automáticamente en DataStore
                    // Ahora puedo hacer requests protegidos
                    val lists = apiService.getShoppingLists()
                    Log.d("MainActivity", "Shopping lists: ${lists.body()}")
                } else {
                    Log.e("MainActivity", "Login failed: ${response.code()}")
                }
            } catch (e: Exception) {
                Log.e("MainActivity", "Error: ${e.message}", e)
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    ShoppingTheme {
        Greeting("Shopping List App")
    }
}