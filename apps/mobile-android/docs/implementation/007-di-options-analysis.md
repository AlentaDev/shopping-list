# DI (Inyección de Dependencias) - Opciones Analizadas

## 1️⃣ **HILT (Recomendado para Clean Architecture)**

### ¿Qué es?
Framework de DI de Google, basado en Dagger 2 pero más simple. Es el estándar oficial para Android moderno.

### Cómo funciona
```kotlin
// Declara dependencias con @Module
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideRetrofitClient(): Retrofit { ... }
}

// Inyecta con @Inject
@HiltViewModel
class AuthViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase
) : ViewModel() { ... }

// Configura activity/fragment
@AndroidEntryPoint
class MainActivity : AppCompatActivity() { ... }
```

### ✅ **Pros**
- **Estándar oficial de Google**: recomendado en Android
- **Compile-time safety**: errores en build, no en runtime
- **Excelente para Clean Architecture**: muy usado en proyectos empresariales
- **Integración nativa**: funciona perfectamente con Jetpack (ViewModel, Navigation)
- **Testing robusto**: fácil hacer mocks con @HiltAndroidTest
- **Documentación excelente**: Google + comunidad

### ❌ **Contras**
- **Setup inicial más largo**: requiere varias anotaciones
- **Boilerplate moderado**: @Module, @Provides, @Singleton
- **Compilación más lenta**: genera código en tiempo de build
- **Curva de aprendizaje**: conceptos como @Module, @Provides, scopes
- **Debugging más difícil**: si falla, los errores son densos

### 💰 **Costo**
- Tiempo setup: ~30 minutos
- Complejidad: Media
- Tamaño APK: +200KB (código generado)

### 🎯 **Caso de uso ideal**
- Clean Architecture estricta
- Proyecto grande con muchas features
- Equipo con experiencia en DI
- Testing exhaustivo

---

## 2️⃣ **KOIN (Simple y pragmático)**

### ¿Qué es?
Framework de DI ligero, Kotlin-first, muy popular en comunidad Kotlin.

### Cómo funciona
```kotlin
// Define módulos en una función
val appModule = module {
    single { RetrofitClient() }
    factory { LoginUseCase(get(), get()) } // get() resuelve dependencias
}

// Inyecta con by inject()
class AuthViewModel : ViewModel() {
    private val loginUseCase: LoginUseCase by inject()
}

// Inicia en Application
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        startKoin {
            androidContext(this@MyApp)
            modules(appModule)
        }
    }
}
```

### ✅ **Pros**
- **Muy simple**: sintaxis limpia, fácil de aprender
- **Menos boilerplate**: declaraciones simples en funciones
- **Kotlin-first**: DSL natural para Kotlin
- **Compilación rápida**: no genera código en build
- **Debugging fácil**: errores claros en runtime
- **Pragmático**: perfecto para MVP rápido

### ❌ **Contras**
- **Runtime checks**: errores se ven en ejecución, no en build
- **No es estándar oficial**: menos usado en grandes empresas
- **Documentación menos abundante**: comunidad pequeña vs Google
- **Type-unsafe en algunos casos**: facilita typos en nombres
- **Performance**: validaciones en runtime (aunque mínimas)
- **Testing más complicado**: menos integración con herramientas

### 💰 **Costo**
- Tiempo setup: ~10 minutos
- Complejidad: Baja
- Tamaño APK: +150KB

### 🎯 **Caso de uso ideal**
- MVP rápido
- Proyecto mediano/pequeño
- Equipo con experiencia en Kotlin
- Prototipado y desarrollo iterativo

---

## 3️⃣ **MANUAL (Minimal overhead)**

### ¿Qué es?
Crear las dependencias manualmente con singleton patterns o factory functions.

### Cómo funciona
```kotlin
// Factory objects (singleton)
object RepositoryFactory {
    private var authRepository: AuthRepository? = null
    
    fun getAuthRepository(): AuthRepository {
        if (authRepository == null) {
            authRepository = AuthRepository(
                RemoteDataSource(),
                LocalDataSource()
            )
        }
        return authRepository
    }
}

// Usa donde quieras
class AuthViewModel : ViewModel() {
    private val loginUseCase = LoginUseCase(RepositoryFactory.getAuthRepository())
}
```

### ✅ **Pros**
- **Sin dependencias externas**: zero overhead
- **Control total**: sabes exactamente qué hace
- **Compilación instantánea**: nada de code generation
- **Debugging trivial**: es código plano
- **APK más pequeño**: sin código generado
- **Aprendizaje nulo**: es JavaScript puro

### ❌ **Contras**
- **Boilerplate masivo**: mucho código manual
- **Difícil de testear**: factories hardcodeadas
- **No escalable**: si crece, se hace caótico
- **Propenso a errores**: duplicar instancias fácilmente
- **Mantenimiento pesado**: cambios afectan múltiples lugares
- **Anti-pattern**: va contra principios SOLID

### 💰 **Costo**
- Tiempo setup: ~5 minutos (pero crece exponencialmente)
- Complejidad: Baja al principio, Alta después
- Tamaño APK: Mínimo

### 🎯 **Caso de uso ideal**
- Proyecto MUY pequeño (una pantalla)
- Prototipo de 1 hora
- Educación/learning (para entender conceptos)
- NO para Clean Architecture

---

## 📊 **Comparativa Visual**

```
                    Hilt      Koin      Manual
Curva aprendizaje   Medio     Bajo      Nulo
Setup time          30min     10min     5min
Type safety         ✅✅      ✅        ❌
Runtime errors      No        Sí        Sí
Testabilidad        ✅✅      ✅        ❌
Boilerplate         Medio     Bajo      Alto (crece)
APK size            +200KB    +150KB    Mínimo
Scalabilidad        ✅✅      ✅        ❌
Estándar oficial    ✅✅      ❌        ❌
Soporte Google      ✅✅      ❌        ❌
Comunidad           Grande    Mediana   N/A
Ideal para MVP      No        ✅        ✅
Ideal para empresa  ✅✅      ✅        ❌
```

---

## 🎯 **MI RECOMENDACIÓN PARA ESTE PROYECTO**

### **Usar HILT**

**Razones:**
1. **Arquitectura Clean**: el proyecto exige arquitectura robusta
2. **TDD obligatorio**: Hilt facilita testing con @HiltAndroidTest
3. **Testing exhaustivo**: mocks automáticos con FakeDI en tests
4. **Escalable**: fácil agregar features iterativamente
5. **Documentación**: tons de recursos disponibles
6. **Estándar Google**: seguir best practices
7. **Integración ViewModel**: funciona perfect con Compose
8. **Profesional**: impresiona en PR reviews

**Setup:**
- 30 minutos de configuración inicial
- Luego: agregar @Module, @Provides, inyectar con @Inject
- Testing: heredar de HiltTestActivity para tests

---

## 🚀 **Pero si quieres ir RÁPIDO...**

Si prefieres **MVP funcional YA** sin tiempo perdido en setup:

### **Opción pragmática: KOIN**
- Setup: 10 minutos
- Implementar: +20% tiempo (Hilt sería -20%)
- Testing: manual (menos integrado)
- Migrar a Hilt después: posible (con esfuerzo)

---

## ⚡ **Decisión Final Para FASE 0**

**¿Qué hacemos?**

1. **HILT**: Setup robusto, TDD desde el inicio, profesional
2. **KOIN**: MVP rápido, refactor a Hilt después
3. **MANUAL**: No recomendado para este proyecto

**Yo voté: HILT** (porque el proyecto exige calidad y TDD)

¿Vamos con Hilt? 🎯

