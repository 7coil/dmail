const iframeLoaded = () => {
	const iFrameID = document.getElementById('iframe');
	if (iFrameID) {
		// here you can make the height, I delete it first, then I make it again
		iFrameID.height = '';
		iFrameID.height = `${iFrameID.contentWindow.document.body.scrollHeight}px`;
	}
};
