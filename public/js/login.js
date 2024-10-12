const urlParams = new URLSearchParams(window.location.search);

function login() {
    const usernameInputElement = document.getElementById("usernameInput");
    const passwordInputElement = document.getElementById("passwordInput");

    let username = usernameInputElement.value;
    let password = passwordInputElement.value;

    fetch("/api/user/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    })
        .then(async (res) => {
            try {
                let data = await res.json();
                console.log(data);
                if (!data.success) throw new Error(data.message);
                let url = urlParams.get("redir");
                if (!!url) window.location.href = url;
                else window.location.href = "/";
            } catch (e) {
                alert(
                    !!e.message
                        ? e.message
                        : "로그인에 실패하였습니다. 잠시후 다시 시도해주세요."
                );
                const form = document.getElementsByTagName("fieldset")[0];
                form.disabled = false;
            }
        })
        .catch((e) => {
            console.error(e);
            alert("로그인에 실패하였습니다. 잠시후 다시 시도해주세요.");
            const form = document.getElementsByTagName("fieldset")[0];
            form.disabled = false;
        });
    return false;
}
