package com.alentadev.shopping.feature.sync.application

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Test

class ArchitectureGuardrailTest {

    @Test
    fun `auth module does not import lists listdetail or sync internals`() {
        val authRoot = File("src/main/java/com/alentadev/shopping/feature/auth")
        val forbiddenImports = listOf(
            "com.alentadev.shopping.feature.lists",
            "com.alentadev.shopping.feature.listdetail",
            "com.alentadev.shopping.feature.sync"
        )

        authRoot.walkTopDown()
            .filter { it.isFile && it.extension == "kt" }
            .forEach { file ->
                val content = file.readText()
                forbiddenImports.forEach { forbidden ->
                    assertFalse("Forbidden import $forbidden in ${file.path}", content.contains("import $forbidden"))
                }
            }
    }
}
