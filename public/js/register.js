const codeReader = new ZXingBrowser.BrowserMultiFormatReader();

const urlParams = new URLSearchParams(window.location.search);

// ===== elements =====
const studentIdInputElement = document.getElementById("studentIdInput");
const dialog = document.getElementsByClassName("barcode-dialog")[0];
const cameraSelectElement = document.getElementById("camera-list");
const emailInputElement = document.getElementById("emailInput");
const usernameInputElement = document.getElementById("usernameInput");
const pwInputElement = document.getElementById("passwordInput");
const pwCheckInputElement = document.getElementById("passwordCheckInput");

codeReader.possableFormats = [
    ZXingBrowser.BarcodeFormat.CODE_39,
    ZXingBrowser.BarcodeFormat.CODE_128,
];

let controls;

function onCancelClick() {
    if (!!controls) {
        controls.stop();
        controls = null;
    }

    dialog.style.display = "none";
}

async function changeCamera(deviceId) {
    console.log(`Started decode from camera with id ${deviceId}`);

    const previewElem = document.querySelector("video#camera");

    if (!!controls) {
        controls.stop();
        controls = null;
    }

    try {
        controls = await codeReader.decodeFromVideoDevice(
            deviceId,
            previewElem,
            checkBarcode
        );
    } catch (e) {
        console.error(e);
        alert("사용할수 없는 카메라입니다. 다른 카메라를 선택해주세요");
    }
}

function checkBarcode(result, error, controls) {
    console.log(result);
    if (!!result?.text) {
        if (!!result.text.match(/^S[0-9]{7}$/g)) {
            controls.stop();
            controls = null;
            studentIdInputElement.value = result.text;
            onCancelClick();
        } else {
            alert("바코드의 형식이 올바르지 않습니다.");
        }
    }
}

async function showDialog() {
    const videoInputDevices =
        await ZXingBrowser.BrowserCodeReader.listVideoInputDevices();

    // choose your media device (webcam, frontal camera, back camera, etc.)
    cameraSelectElement.innerHTML = "";

    videoInputDevices.forEach((e) => {
        let option = document.createElement("option");
        option.value = e.deviceId;
        option.text = e.label;
        console.log(e);
        cameraSelectElement.appendChild(option);
    });
    const selectedDeviceId = videoInputDevices[0].deviceId;

    dialog.style.display = "block";

    changeCamera(selectedDeviceId);
}

function submitData(event) {
    let studentId = studentIdInputElement.value;
    let email = emailInputElement.value;
    let username = usernameInputElement.value;
    let password = pwInputElement.value;
    let passwordCheck = pwCheckInputElement.value;

    if (password != passwordCheck) {
        //TODO: password not match
    }

    fetch("/api/user/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            studentID: studentId,
            username,
            email,
            password,
        }),
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
                        : "회원가입을 완료할 수 없습니다. 잠시 후 다시시도해주세요."
                );
                const form = document.getElementsByTagName("fieldset")[0];
                form.disabled = false;
            }
        })
        .catch((e) => {
            console.error(e);
            alert("회원가입을 완료할 수 없습니다. 잠시 후 다시시도해주세요.");
            const form = document.getElementsByTagName("fieldset")[0];
            form.disabled = false;
        });
    const form = document.getElementsByTagName("fieldset")[0];
    form.disabled = true;
    return false;
}
