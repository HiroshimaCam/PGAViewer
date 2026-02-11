chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: "../html/index.html",
    type: "popup",
    width: 364,
    height: 430
  })
})