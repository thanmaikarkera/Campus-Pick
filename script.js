const lostForm = document.getElementById("lost-form");
const foundForm = document.getElementById("found-form");

async function saveReport(form, type) {

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        // Get the logged-in user
        const { data: { user }, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError || !user) {
            alert("Please login before submitting a report.");
            window.location.href = "login.html";
            return;
        }

        // Get form values
        const itemName =
            form.querySelector("#item-name").value.trim();

        const category =
            form.querySelector("#category").value;

        const color =
            form.querySelector("#color").value.trim();

        const brand =
            form.querySelector("#brand").value.trim();


        const location =
            form.querySelector("#location").value.trim();

        const date =
            form.querySelector('input[type="date"]').value;

        const description =
            form.querySelector("#description").value.trim();

        const imageInput =
            form.querySelector("#image");

        const imageFile =
            imageInput.files[0];

        // This will eventually contain the Storage URL
        let imageUrl = null;


        // =====================================
        // 1. Upload image if the user selected one
        // =====================================

        if (imageFile) {

            // Create a unique filename
            const uniqueId =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const fileName =
    `${uniqueId}-${imageFile.name}`;

            // Store the image inside the user's folder
            const filePath =
                `${user.id}/${fileName}`;


            const { error: uploadError } =
                await supabaseClient
                    .storage
                    .from("item-images")
                    .upload(filePath, imageFile);


            if (uploadError) {

                console.error(
                    "Image upload error:",
                    uploadError
                );

                alert(uploadError.message);
                return;
            }


            // Get the public URL of the uploaded image
            const { data: publicUrlData } =
                supabaseClient
                    .storage
                    .from("item-images")
                    .getPublicUrl(filePath);


            imageUrl =
                publicUrlData.publicUrl;
        }


        // =====================================
        // 2. Create the report
        // =====================================

        const report = {

            user_id: user.id,

            type: type,

            status:
                type === "Lost"
                    ? "Lost"
                    : "Found",

            item_name: itemName,

            category: category,

            color: color,

            brand: brand,

            location: location,

            date: date,

            description: description,

            image_url: imageUrl
        };


        // =====================================
        // 3. Save report in PostgreSQL
        // =====================================

        const { data, error } =
            await supabaseClient
                .from("reports")
                .insert(report)
                .select();


        if (error) {

            console.error(
                "Report submission error:",
                error
            );

            alert(error.message);
            return;
        }


        console.log(
            "Report submitted:",
            data
        );


        alert(
            "Your report has been submitted successfully!"
        );

        form.reset();
    });
}

if (lostForm) {
    saveReport(lostForm, "Lost");
}

if (foundForm) {
    saveReport(foundForm, "Found");
}

const reportsContainer = document.getElementById("reports-container");
const searchInput = document.getElementById("search-input");
const typeFilter = document.getElementById("type-filter");

async function displayReports() {

    if (!reportsContainer) return;

    const { data: reports, error } =
        await supabaseClient
            .from("reports")
            .select("*")
            .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading reports:", error);
        reportsContainer.innerHTML =
            "<p>Unable to load reports.</p>";
        return;
    }

    const searchTerm =
        searchInput.value.toLowerCase();

    const selectedType =
        typeFilter.value;

    const filteredReports = reports.filter(report => {

        const matchesSearch =
            report.item_name.toLowerCase().includes(searchTerm) ||
            report.category.toLowerCase().includes(searchTerm) ||
            report.location.toLowerCase().includes(searchTerm);

        const matchesType =
            selectedType === "all" ||
            report.type === selectedType;

        return matchesSearch && matchesType;
    });

    reportsContainer.innerHTML = "";

    if (filteredReports.length === 0) {
        reportsContainer.innerHTML =
            "<p>No reports found.</p>";
        return;
    }

    filteredReports.forEach(report => {

        const card =
            document.createElement("article");

        card.className = "report-card";

        card.innerHTML = `
            ${report.image_url
                ? `<img src="${report.image_url}"
                    class="report-image"
                    alt="${report.item_name}">`
                : ""
            }

            <span class="status status-${report.status.toLowerCase()}">
                ${report.status}
            </span>

            <h3>${report.item_name}</h3>

            <p>
                <strong>Category:</strong>
                ${report.category}
            </p>

            <p>
                <strong>Location:</strong>
                ${report.location}
            </p>

            <p>
                <strong>Date:</strong>
                ${report.date}
            </p>

            <p>${report.description}</p>

            ${report.status === "Matched"
    ? `<button onclick="updateStatus('${report.id}')">Verify Match</button>`
    : report.status === "Verified"
    ? `<button onclick="updateStatus('${report.id}')">Mark as Returned</button>`
    : ""
}
        `;

        reportsContainer.appendChild(card);
    });
}

if (reportsContainer) {

    displayReports();

    searchInput.addEventListener("input", displayReports);

    typeFilter.addEventListener("change", displayReports);
}


// Registration

const registerForm = document.getElementById("register-form");

if (registerForm) {

    registerForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const name =
            document.getElementById("register-name").value.trim();

        const email =
            document.getElementById("register-email").value.trim();

        const password =
            document.getElementById("register-password").value;

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name
                },
                emailRedirectTo: `${window.location.origin}/login.html`
            }
        });

        if (error) {
            console.error(error);
            alert(error.message);
            return;
        }

        console.log("Registration successful:", data);

        alert(
            "Account created! Please check your email and confirm your account before logging in."
        );

        window.location.href = "login.html";
    });
}

// Login

const loginForm = document.getElementById("login-form");

if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const email =
            document.getElementById("login-email").value.trim();

        const password =
            document.getElementById("login-password").value;

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            console.error(error);
            alert(error.message);
            return;
        }

        const user = data.user;

        // Check whether the user's profile already exists
        const { data: existingProfile, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("id")
                .eq("id", user.id)
                .maybeSingle();

        if (profileError) {
            console.error(profileError);
            alert(profileError.message);
            return;
        }

        // Create profile if this is the user's first login
        if (!existingProfile) {

            const { error: insertError } =
                await supabaseClient
                    .from("profiles")
                    .insert({
                        id: user.id,
                        name: user.user_metadata.name || "User",
                        role: "student"
                    });

            if (insertError) {
                console.error(insertError);
                alert(insertError.message);
                return;
            }
        }

        

        alert("Login successful!");

        window.location.href = "index.html";
    });
}

// ===============================
// SMART MATCHING SYSTEM
// ===============================

function normalizeText(text) {

    return (text || "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();
}


// Words that can describe similar things
const synonyms = {
    phone: ["mobile", "smartphone", "cellphone", "cell"],
    mobile: ["phone", "smartphone", "cellphone", "cell"],
    smartphone: ["phone", "mobile", "cellphone", "cell"],

    laptop: ["notebook", "computer"],
    notebook: ["laptop", "computer"],
    computer: ["laptop", "notebook"],

    bag: ["backpack", "rucksack", "pouch"],
    backpack: ["bag", "rucksack"],

    wallet: ["purse"],
    purse: ["wallet"],

    bottle: ["flask"],
    flask: ["bottle"],

    spectacles: ["glasses", "eyeglasses"],
    glasses: ["spectacles", "eyeglasses"],

    earphones: ["earbuds", "headphones"],
    earbuds: ["earphones", "headphones"],
    headphones: ["earphones", "earbuds"]
};


function getWords(text) {

    const words = normalizeText(text).split(/\s+/);

    return words.filter(word => word.length > 1);
}


function wordsAreSimilar(word1, word2) {

    if (word1 === word2) {
        return true;
    }

    // Check our synonym list
    if (
        synonyms[word1] &&
        synonyms[word1].includes(word2)
    ) {
        return true;
    }

    // Check partial word similarity
    if (
        word1.length >= 4 &&
        word2.length >= 4 &&
        (word1.includes(word2) || word2.includes(word1))
    ) {
        return true;
    }

    return false;
}


function textSimilarity(text1, text2) {

    const words1 = getWords(text1);
    const words2 = getWords(text2);

    if (words1.length === 0 || words2.length === 0) {
        return 0;
    }

    let matches = 0;

    words1.forEach(word1 => {

        const found = words2.some(word2 =>
            wordsAreSimilar(word1, word2)
        );

        if (found) {
            matches++;
        }
    });

    return matches / Math.max(words1.length, words2.length);
}


function locationSimilarity(location1, location2) {

    return textSimilarity(location1, location2);
}


function dateSimilarity(date1, date2) {

    if (!date1 || !date2) {
        return 0;
    }

    if (date1 === date2) {
        return 1;
    }

    const firstDate = new Date(date1);
    const secondDate = new Date(date2);

    const difference =
        Math.abs(firstDate - secondDate);

    const days =
        difference / (1000 * 60 * 60 * 24);

    if (days <= 1) {
        return 0.7;
    }

    if (days <= 3) {
        return 0.4;
    }

    return 0;
}


function calculateMatchScore(lostReport, foundReport) {

    let score = 0;

    // ---------------------------
    // 1. Item name - 25 points
    // ---------------------------

    const itemSimilarity =
        textSimilarity(
            lostReport.item_name,
            foundReport.item_name
        );

    score += itemSimilarity * 25;


    // ---------------------------
    // 2. Category - 15 points
    // ---------------------------

    if (
        normalizeText(lostReport.category) ===
        normalizeText(foundReport.category)
    ) {
        score += 15;
    }


    // ---------------------------
    // 3. Location - 15 points
    // ---------------------------

    const locationScore =
        locationSimilarity(
            lostReport.location,
            foundReport.location
        );

    score += locationScore * 15;


    // ---------------------------
    // 4. Date - 10 points
    // ---------------------------

    score +=
        dateSimilarity(
            lostReport.date,
            foundReport.date
        ) * 10;


    // ---------------------------
    // 5. Color - 15 points
    // ---------------------------

    const colorScore =
        textSimilarity(
            lostReport.color,
            foundReport.color
        );

    score += colorScore * 15;


    // ---------------------------
    // 6. Brand - 10 points
    // ---------------------------

    const brandScore =
        textSimilarity(
            lostReport.brand,
            foundReport.brand
        );

    score += brandScore * 10;


    // ---------------------------
    // 7. Description - 10 points
    // ---------------------------

    const descriptionScore =
        textSimilarity(
            lostReport.description,
            foundReport.description
        );

    score += descriptionScore * 10;


    return Math.round(score);
}


async function findMatches() {

    const { data: reports, error } =
        await supabaseClient
            .from("reports")
            .select("*")
            .in("status", ["Lost", "Found"]);

    if (error) {
        console.error(
            "Error loading reports for matching:",
            error
        );

        return [];
    }


    const lostReports =
        reports.filter(report =>
            report.type === "Lost" &&
            report.status === "Lost"
        );


    const foundReports =
        reports.filter(report =>
            report.type === "Found" &&
            report.status === "Found"
        );


    const matches = [];


    lostReports.forEach(lost => {

        foundReports.forEach(found => {

            const score =
                calculateMatchScore(
                    lost,
                    found
                );

            // 60% or above = possible match
            if (score >= 60) {

                matches.push({
                    lost: lost,
                    found: found,
                    score: score
                });
            }
        });
    });


    // Highest matches first
    matches.sort((a, b) =>
        b.score - a.score
    );


    console.log(
        "Possible matches:",
        matches
    );

    return matches;
}


const matchesContainer =
    document.getElementById("matches-container");


async function displayMatches() {

    if (!matchesContainer) {
        return;
    }


    const matches =
        await findMatches();


    matchesContainer.innerHTML = "";


    if (matches.length === 0) {

        matchesContainer.innerHTML =
            "<p>No possible matches found.</p>";

        return;
    }


    matches.forEach(match => {

        const card =
            document.createElement("article");

        card.className = "match-card";


        card.innerHTML = `

            <span class="status status-matched">
                Possible Match: ${match.score}%
            </span>

            <h3>
                ${match.lost.item_name}
            </h3>

            <p>
                <strong>Lost:</strong>
                ${match.lost.location}
            </p>

            <p>
                <strong>Found:</strong>
                ${match.found.location}
            </p>

            <p>
                <strong>Category:</strong>
                ${match.lost.category}
            </p>

            <p>
                <strong>Lost Description:</strong>
                ${match.lost.description}
            </p>

            <p>
                <strong>Found Description:</strong>
                ${match.found.description}
            </p>

            <button
                onclick="confirmMatch(
                    '${match.lost.id}',
                    '${match.found.id}'
                )">
                Confirm Match
            </button>
        `;


        matchesContainer.appendChild(card);
    });
}


if (matchesContainer) {

    displayMatches();

}


async function updateStatus(reportId) {
    const { data: report, error: fetchError } =
        await supabaseClient
            .from("reports")
            .select("id, status")
            .eq("id", reportId)
            .single();

    if (fetchError || !report) {
        console.error("Error finding report:", fetchError);
        return;
    }

    let newStatus;

    if (report.status === "Matched") {
        newStatus = "Verified";
    } else if (report.status === "Verified") {
        newStatus = "Returned";
    } else {
        return;
    }

    const { error: updateError } =
        await supabaseClient
            .from("reports")
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq("id", reportId);

    if (updateError) {
        console.error("Error updating report status:", updateError);
        alert(updateError.message);
        return;
    }

    await displayReports();
    await displayMyReports();
}

const myReportsContainer =
    document.getElementById("my-reports-container");

async function displayMyReports() {

    if (!myReportsContainer) return;

    // Get the currently logged-in Supabase user
    const { data: { user }, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !user) {
        myReportsContainer.innerHTML =
            "<p>Please login to view your reports.</p>";
        return;
    }

    // Get only this user's reports
    const { data: reports, error } =
        await supabaseClient
            .from("reports")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading your reports:", error);

        myReportsContainer.innerHTML =
            "<p>Unable to load your reports.</p>";

        return;
    }

    if (reports.length === 0) {
        myReportsContainer.innerHTML =
            "<p>You haven't submitted any reports yet.</p>";

        return;
    }

    myReportsContainer.innerHTML = "";

    reports.forEach(report => {

        const card =
            document.createElement("article");

        card.className = "report-card";

        card.innerHTML = `
            ${report.image_url
                ? `<img
                    src="${report.image_url}"
                    class="report-image"
                    alt="${report.item_name}">
                  `
                : ""
            }

            <span class="status status-${report.status.toLowerCase()}">
                ${report.status}
            </span>

            <h3>${report.item_name}</h3>

            <p>
                <strong>Type:</strong>
                ${report.type}
            </p>

            <p>
                <strong>Category:</strong>
                ${report.category}
            </p>

            <p>
                <strong>Location:</strong>
                ${report.location}
            </p>

            <p>
                <strong>Date:</strong>
                ${report.date}
            </p>

            <p>${report.description}</p>
        `;

        myReportsContainer.appendChild(card);
    });
}

displayMyReports();


const adminReportsContainer =
    document.getElementById("admin-reports-container");

async function displayAdminReports() {

    if (!adminReportsContainer) return;

    const { data: reports, error } =
        await supabaseClient
            .from("reports")
            .select("*")
            .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading admin reports:", error);

        adminReportsContainer.innerHTML =
            "<p>Unable to load reports.</p>";

        return;
    }

    const totalReports =
        document.getElementById("total-reports");

    const lostCount =
        document.getElementById("lost-count");

    const foundCount =
        document.getElementById("found-count");

    const returnedCount =
        document.getElementById("returned-count");


    // Update statistics
    totalReports.textContent =
        reports.length;

    lostCount.textContent =
        reports.filter(report =>
            report.type === "Lost"
        ).length;

    foundCount.textContent =
        reports.filter(report =>
            report.type === "Found"
        ).length;

    returnedCount.textContent =
        reports.filter(report =>
            report.status === "Returned"
        ).length;


    adminReportsContainer.innerHTML = "";


    if (reports.length === 0) {

        adminReportsContainer.innerHTML =
            "<p>No reports available.</p>";

        return;
    }


    reports.forEach(report => {

        const card =
            document.createElement("article");

        card.className = "report-card";


        card.innerHTML = `

            ${report.image_url
                ? `<img
                    src="${report.image_url}"
                    class="report-image"
                    alt="${report.item_name}">
                  `
                : ""
            }

            <span class="status status-${report.status.toLowerCase()}">
                ${report.status}
            </span>

            <h3>${report.item_name}</h3>

            <p>
                <strong>Type:</strong>
                ${report.type}
            </p>

            <p>
                <strong>Category:</strong>
                ${report.category}
            </p>

            <p>
                <strong>Location:</strong>
                ${report.location}
            </p>

            <p>
                <strong>Date:</strong>
                ${report.date}
            </p>

            <p>${report.description}</p>

            <button
                onclick="deleteReport('${report.id}')">
                Delete Report
            </button>
        `;


        adminReportsContainer.appendChild(card);
    });
}

async function deleteReport(reportId) {

    const confirmed =
        confirm("Are you sure you want to delete this report?");

    if (!confirmed) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("reports")
            .delete()
            .eq("id", reportId);


    if (error) {

        console.error(
            "Error deleting report:",
            error
        );

        alert(error.message);
        return;
    }


    alert("Report deleted successfully!");


    await displayAdminReports();
}

async function checkAdminAccess() {
    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        window.location.href = "login.html";
        return false;
    }

    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

    if (profileError || !profile || profile.role !== "admin") {
        alert("Access denied. Admins only.");
        window.location.href = "index.html";
        return false;
    }

    return true;
}

if (adminReportsContainer) {
    checkAdminAccess().then((isAdmin) => {
        if (isAdmin) {
            displayAdminReports();
        }
    });
}

    // Confirm a possible match

async function confirmMatch(lostId, foundId) {

    // Update the Lost report
    const { error: lostError } =
        await supabaseClient
            .from("reports")
            .update({
                status: "Matched"
            })
            .eq("id", lostId);

    if (lostError) {
        console.error(
            "Error updating lost report:",
            lostError
        );

        alert(lostError.message);
        return;
    }


    // Update the Found report
    const { error: foundError } =
        await supabaseClient
            .from("reports")
            .update({
                status: "Matched"
            })
            .eq("id", foundId);

    if (foundError) {
        console.error(
            "Error updating found report:",
            foundError
        );

        alert(foundError.message);
        return;
    }


    alert("Match confirmed successfully!");


    // Refresh the dashboard
    await displayReports();
    await displayMatches();
}


async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Logout error:", error);
        alert(error.message);
        return;
    }

    window.location.href = "index.html";
}

const protectedPages = [
    "dashboard",
    "dashboard.html",
    "my-reports",
    "my-reports.html",
    "report-lost",
    "report-lost.html",
    "report-found",
    "report-found.html"
];

const currentPage = window.location.pathname.split("/").pop();

async function checkAuthentication() {
    if (!protectedPages.includes(currentPage)) return;

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
    }
}

checkAuthentication();


async function updateNavbar() {
    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    const isLoggedIn = !!user;

    const dashboardLink = document.getElementById("dashboard-link");
    const myReportsLink = document.getElementById("my-reports-link");
    const reportLostLink = document.getElementById("report-lost-link");
    const reportFoundLink = document.getElementById("report-found-link");
    const loginLink = document.getElementById("login-link");
    const registerLink = document.getElementById("register-link");
    const logoutButton = document.getElementById("logout-button");

    if (dashboardLink) {
        dashboardLink.style.display = isLoggedIn ? "inline-block" : "none";
    }

    if (myReportsLink) {
        myReportsLink.style.display = isLoggedIn ? "inline-block" : "none";
    }

    if (reportLostLink) {
        reportLostLink.style.display = isLoggedIn ? "inline-block" : "none";
    }

    if (reportFoundLink) {
        reportFoundLink.style.display = isLoggedIn ? "inline-block" : "none";
    }

    if (loginLink) {
        loginLink.style.display = isLoggedIn ? "none" : "inline-block";
    }

    if (registerLink) {
        registerLink.style.display = isLoggedIn ? "none" : "inline-block";
    }

    if (logoutButton) {
        logoutButton.style.display = isLoggedIn ? "inline-block" : "none";
    }
}

updateNavbar();


const reportLostHome = document.getElementById("report-lost-home");
const reportFoundHome = document.getElementById("report-found-home");

async function protectHomeReportButton(button, targetPage) {
    if (!button) return;

    button.addEventListener("click", async function (event) {
        event.preventDefault();

        const {
            data: { user }
        } = await supabaseClient.auth.getUser();

        if (user) {
            window.location.href = targetPage;
        } else {
            window.location.href = "login.html";
        }
    });
}

protectHomeReportButton(reportLostHome, "report-lost.html");
protectHomeReportButton(reportFoundHome, "report-found.html");