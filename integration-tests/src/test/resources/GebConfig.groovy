import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.chrome.ChromeOptions

atCheckWaiting = true

waiting {
    timeout = 2
}

environments {
    if (System.getenv("CI")) {
        chromeHeadless {
        driver = {
            ChromeOptions options = new ChromeOptions()
            options.addArguments('headless')
            new ChromeDriver(options)
        }
    }
    } else {
        chrome {
        driver = { new ChromeDriver() }
    }

    chromeHeadless {
        driver = {
            ChromeOptions options = new ChromeOptions()
            options.addArguments('headless')
            new ChromeDriver(options)
            }
        }
    }
}

// Default if geb.env is not set to one of 'chrome', or 'chromeHeadless'
if (!System.getenv("CI") && !System.getProperty("geb.env")) {
    driver = { new ChromeDriver() } 
}

baseUrl = "http://localhost:3000/"

reportsDir = "build/geb-reports"
