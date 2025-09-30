import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.chrome.ChromeOptions

atCheckWaiting = true

waiting {
    timeout = 2
}

if (System.getenv("CI")) {
    driver = {
        ChromeOptions options = new ChromeOptions()
        options.addArguments('headless') 
        options.addArguments('disable-gpu')
        options.addArguments('no-sandbox') 
        options.addArguments('disable-dev-shm-usage')
        new ChromeDriver(options)
    }
} else {
    driver = { new ChromeDriver() }
}

baseUrl = "http://localhost:3000/"

reportsDir = "build/geb-reports"
