/**
 * Responsive Hooks — useActiveDevice + useResponsiveAttributes.
 * Attached to: window.SNNControls.useActiveDevice, .useResponsiveAttributes
 */
const { useSelect } = wp.data;
const C = window.SNNControls = window.SNNControls || {};

/* ─── useActiveDevice — returns 'desktop' | 'tablet' | 'mobile' ─── */
C.useActiveDevice = () => {
    const deviceType = useSelect(select => {
        const editorStore = select('core/editor');
        if (editorStore?.getDeviceType) {
            return editorStore.getDeviceType();
        }
        const store = select('core/edit-post') || editorStore;
        const getDevice = store?.__experimentalGetPreviewDeviceType;
        return getDevice ? getDevice() : 'Desktop';
    }, []);
    return (deviceType || 'Desktop').toLowerCase();
};

/* ─── useResponsiveAttributes — getVal / setVal / inheritVal / padding/margin helpers ─── */
C.useResponsiveAttributes = (attributes, setAttributes) => {
    const activeDevice = C.useActiveDevice();

    // Normalize helper: ensure attribute is an object, not an array.
    // WP may serialize empty objects {} as [] in block delimiter comments.
    const obj = (attr) => {
        const v = attributes[attr];
        if (Array.isArray(v)) return {};
        if (!v || typeof v !== 'object') return {};
        return v;
    };

    const getVal = (attr) => {
        const o = obj(attr);
        return o[activeDevice] || '';
    };

    const setVal = (attr, value) => {
        const o = obj(attr);
        setAttributes({ [attr]: { ...o, [activeDevice]: value } });
    };

    // Inherited value cascade: current device → tablet → desktop → fallback
    const inheritVal = (attr, fallback = '') => {
        const val = obj(attr);
        if (val[activeDevice]) return val[activeDevice];
        if (activeDevice === 'mobile' && val.tablet) return val.tablet;
        if (val.desktop) return val.desktop;
        return fallback;
    };

    // 4-side helpers (padding, margin, border width, border radius)
    const getSides = (attr) => {
        const o = obj(attr);
        return o[activeDevice] || { top: '', right: '', bottom: '', left: '' };
    };
    const setSides = (attr, sideObj) => {
        const o = obj(attr);
        setAttributes({ [attr]: { ...o, [activeDevice]: sideObj } });
    };
    const inheritSides = (attr) => {
        const sides = obj(attr);
        const tryDevices = ['mobile', 'tablet', 'desktop'];
        const start = tryDevices.indexOf(activeDevice);
        for (let i = start; i < tryDevices.length; i++) {
            const d = tryDevices[i];
            if (sides[d] && Object.values(sides[d]).some(v => v !== '' && v !== null)) return sides[d];
        }
        return { top: '', right: '', bottom: '', left: '' };
    };

    // Padding aliases (for text block backwards compatibility)
    const getPad = () => getSides('padding');
    const setPad = (sideObj) => setSides('padding', sideObj);
    const inheritPad = () => inheritSides('padding');

    // Border width helpers — border.width is nested inside the border object.
    // The border attribute itself may also be an empty array [] from WP serialization.
    const getBorderWidth = () => {
        const border = Array.isArray(attributes.border) ? {} : (attributes.border || {});
        const bw = border.width;
        return (bw && !Array.isArray(bw) && bw[activeDevice]) ? bw[activeDevice] : { top: '', right: '', bottom: '', left: '' };
    };
    const setBorderWidth = (sideObj) => {
        const border = Array.isArray(attributes.border) ? {} : (attributes.border || {});
        setAttributes({
            border: { ...border, width: { ...(border.width && !Array.isArray(border.width) ? border.width : {}), [activeDevice]: sideObj } }
        });
    };

    // Border radius helpers — use proper corner keys (NOT top/right/bottom/left)
    const getBorderRadius = () => {
        const br = Array.isArray(attributes.borderRadius) ? {} : (attributes.borderRadius || {});
        return (br[activeDevice]) ? br[activeDevice] : { topLeft: '', topRight: '', bottomRight: '', bottomLeft: '' };
    };
    const setBorderRadius = (sideObj) => {
        const br = Array.isArray(attributes.borderRadius) ? {} : (attributes.borderRadius || {});
        setAttributes({
            borderRadius: { ...br, [activeDevice]: sideObj }
        });
    };

    return { activeDevice, getVal, setVal, inheritVal, getSides, setSides, inheritSides,
        getPad, setPad, inheritPad, getBorderWidth, setBorderWidth, getBorderRadius, setBorderRadius };
};
