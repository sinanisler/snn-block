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

    const getVal = (attr) => attributes[attr]?.[activeDevice] || '';

    const setVal = (attr, value) => {
        setAttributes({ [attr]: { ...(attributes[attr] || {}), [activeDevice]: value } });
    };

    // Inherited value cascade: current device → tablet → desktop → fallback
    const inheritVal = (attr, fallback = '') => {
        const val = attributes[attr];
        if (!val || typeof val !== 'object') return fallback;
        if (val[activeDevice]) return val[activeDevice];
        if (activeDevice === 'mobile' && val.tablet) return val.tablet;
        if (val.desktop) return val.desktop;
        return fallback;
    };

    // 4-side helpers (padding, margin, border width, border radius)
    const getSides = (attr) => attributes[attr]?.[activeDevice] || { top: '', right: '', bottom: '', left: '' };
    const setSides = (attr, obj) => {
        setAttributes({ [attr]: { ...(attributes[attr] || {}), [activeDevice]: obj } });
    };
    const inheritSides = (attr) => {
        const sides = attributes[attr];
        if (!sides || typeof sides !== 'object') return { top: '', right: '', bottom: '', left: '' };
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
    const setPad = (obj) => setSides('padding', obj);
    const inheritPad = () => inheritSides('padding');

    // Border width helpers — border.width is nested inside the border object
    const getBorderWidth = () => {
        const bw = attributes.border?.width;
        return (bw && bw[activeDevice]) ? bw[activeDevice] : { top: '', right: '', bottom: '', left: '' };
    };
    const setBorderWidth = (obj) => {
        const border = attributes.border || {};
        setAttributes({
            border: { ...border, width: { ...(border.width || {}), [activeDevice]: obj } }
        });
    };

    // Border radius aliases using getSides/setSides (borderRadius IS top-level)
    const getBorderRadius = () => getSides('borderRadius');
    const setBorderRadius = (obj) => setSides('borderRadius', obj);

    return { activeDevice, getVal, setVal, inheritVal, getSides, setSides, inheritSides,
        getPad, setPad, inheritPad, getBorderWidth, setBorderWidth, getBorderRadius, setBorderRadius };
};
