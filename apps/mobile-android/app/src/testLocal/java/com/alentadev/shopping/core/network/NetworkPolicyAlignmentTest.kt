package com.alentadev.shopping.core.network

import com.alentadev.shopping.BuildConfig
import java.io.File
import javax.xml.parsers.DocumentBuilderFactory
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class NetworkPolicyAlignmentTest {

    @Test
    fun `local flavor keeps local cleartext host and does not widen policy`() {
        assertTrue(BuildConfig.API_BASE_URL.startsWith("http://10.0.2.2"))

        val manifest = File("src/main/AndroidManifest.xml").readText()
        assertTrue(manifest.contains("android:usesCleartextTraffic=\"\${usesCleartextTraffic}\""))

        val doc = DocumentBuilderFactory.newInstance()
            .newDocumentBuilder()
            .parse(File("src/main/res/xml/network_security_config.xml"))

        val domainConfigs = doc.getElementsByTagName("domain-config")
        val cleartextTrueDomains = mutableSetOf<String>()
        val cleartextFalseDomains = mutableSetOf<String>()

        for (index in 0 until domainConfigs.length) {
            val node = domainConfigs.item(index)
            val cleartext = node.attributes?.getNamedItem("cleartextTrafficPermitted")?.nodeValue
            val domains = node.childNodes
            for (child in 0 until domains.length) {
                val domainNode = domains.item(child)
                if (domainNode.nodeName != "domain") continue
                val domain = domainNode.textContent.trim()
                if (cleartext == "true") cleartextTrueDomains += domain
                if (cleartext == "false") cleartextFalseDomains += domain
            }
        }

        assertEquals(setOf("10.0.2.2", "localhost", "127.0.0.1"), cleartextTrueDomains)
        assertEquals(setOf("api-shopping-list.onrender.com"), cleartextFalseDomains)
    }
}
