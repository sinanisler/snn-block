/**
 * Text Advanced Control — Text Overflow, White Space, Word Break, Vertical Align.
 * Attached to: window.SNNControls.TextOverflowSelect, .WhiteSpaceSelect, .WordBreakSelect, .VerticalAlignSelect
 */
const { __ } = wp.i18n;
const C = window.SNNControls = window.SNNControls || {};

/* ─── Text Overflow Select ─── */
C.TextOverflowSelect = ({ label, value, onChange }) => {
    const opts = [
        { value: '',       label: '—' },
        { value: 'clip',   label: __('Clip','snn') },
        { value: 'ellipsis', label: __('Ellipsis','snn') },
    ];
    return <C.CompactSelect label={label || __('Text Overflow','snn')} value={value || ''} options={opts} onChange={onChange} />;
};

/* ─── White Space Select ─── */
C.WhiteSpaceSelect = ({ label, value, onChange }) => {
    const opts = [
        { value: '',            label: '—' },
        { value: 'normal',      label: __('Normal','snn') },
        { value: 'nowrap',      label: __('No Wrap','snn') },
        { value: 'pre',         label: __('Pre','snn') },
        { value: 'pre-wrap',    label: __('Pre Wrap','snn') },
        { value: 'pre-line',    label: __('Pre Line','snn') },
        { value: 'break-spaces',label: __('Break Spaces','snn') },
    ];
    return <C.CompactSelect label={label || __('White Space','snn')} value={value || ''} options={opts} onChange={onChange} />;
};

/* ─── Word Break Select ─── */
C.WordBreakSelect = ({ label, value, onChange }) => {
    const opts = [
        { value: '',          label: '—' },
        { value: 'normal',    label: __('Normal','snn') },
        { value: 'break-all', label: __('Break All','snn') },
        { value: 'keep-all',  label: __('Keep All','snn') },
        { value: 'break-word',label: __('Break Word','snn') },
    ];
    return <C.CompactSelect label={label || __('Word Break','snn')} value={value || ''} options={opts} onChange={onChange} />;
};

/* ─── Vertical Align Select ─── */
C.VerticalAlignSelect = ({ label, value, onChange }) => {
    const opts = [
        { value: '',           label: '—' },
        { value: 'baseline',   label: __('Baseline','snn') },
        { value: 'top',        label: __('Top','snn') },
        { value: 'middle',     label: __('Middle','snn') },
        { value: 'bottom',     label: __('Bottom','snn') },
        { value: 'text-top',   label: __('Text Top','snn') },
        { value: 'text-bottom',label: __('Text Bottom','snn') },
        { value: 'sub',        label: __('Sub','snn') },
        { value: 'super',      label: __('Super','snn') },
    ];
    return <C.CompactSelect label={label || __('Vert Align','snn')} value={value || ''} options={opts} onChange={onChange} />;
};
