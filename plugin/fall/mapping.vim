if exists('g:loaded_fall_mapping')
  finish
endif
let g:loaded_fall_mapping = 1

" Cursor
cnoremap <silent> <Plug>(fall-cursor-first) <Cmd>call <SID>dispatch('select-cursor-move-at', 1)<CR>
cnoremap <silent> <Plug>(fall-cursor-last) <Cmd>call <SID>dispatch('select-cursor-move-at', '$')<CR>
cnoremap <silent> <Plug>(fall-cursor-next) <Cmd>call <SID>dispatch('select-cursor-move', 1)<CR>
cnoremap <silent> <Plug>(fall-cursor-prev) <Cmd>call <SID>dispatch('select-cursor-move', -1)<CR>
cnoremap <silent> <Plug>(fall-cursor-scroll-next) <Cmd>call <SID>dispatch('select-cursor-move', <SID>select_scroll())<CR>
cnoremap <silent> <Plug>(fall-cursor-scroll-prev) <Cmd>call <SID>dispatch('select-cursor-move', -1 * <SID>select_scroll())<CR>
" Select
cnoremap <silent> <Plug>(fall-select) <Cmd>call <SID>dispatch('select-select')<CR>
cnoremap <silent> <Plug>(fall-select-all) <Cmd>call <SID>dispatch('select-select-all')<CR>
" Action
cnoremap <silent> <Plug>(fall-action-select) <Cmd>call <SID>dispatch('action-invoke', '@select')<CR>
cnoremap <silent> <Plug>(fall-action-default) <Cmd>call <SID>dispatch('action-invoke', '@default')<CR>
" Preview
cnoremap <silent> <Plug>(fall-preview-first) <Cmd>call <SID>dispatch('preview-cursor-move-at', 1)<CR>
cnoremap <silent> <Plug>(fall-preview-last) <Cmd>call <SID>dispatch('preview-cursor-move-at', '$')<CR>
cnoremap <silent> <Plug>(fall-preview-next) <Cmd>call <SID>dispatch('preview-cursor-move', 1)<CR>
cnoremap <silent> <Plug>(fall-preview-prev) <Cmd>call <SID>dispatch('preview-cursor-move', -1)<CR>
cnoremap <silent> <Plug>(fall-preview-scroll-next) <Cmd>call <SID>dispatch('preview-cursor-move', <SID>preview_scroll())<CR>
cnoremap <silent> <Plug>(fall-preview-scroll-prev) <Cmd>call <SID>dispatch('preview-cursor-move', -1 * <SID>preview_scroll())<CR>
cnoremap <silent> <Plug>(fall-preview-scroll-right) <Cmd>call <SID>dispatch('preview-cursor-move-horizontal', 1)<CR>
cnoremap <silent> <Plug>(fall-preview-scroll-left) <Cmd>call <SID>dispatch('preview-cursor-move-horizontal', -1)<CR>
cnoremap <silent> <Plug>(fall-preview-previewer-next) <Cmd>call <SID>dispatch('preview-previewer-rotate', 1)<CR>
cnoremap <silent> <Plug>(fall-preview-previewer-prev) <Cmd>call <SID>dispatch('preview-previewer-rotate', -1)<CR>

function! s:dispatch(name, ...) abort
  const l:args = a:0 ? [a:name, a:1] : [a:name]
  call denops#notify('fall', 'event:dispatch', l:args)
endfunction

function! s:select_scroll() abort
  let l:winid = get(g:, '_fall_component_select_winid')
  if !l:winid
    return &scroll
  endif
  return getwinvar(l:winid, '&l:scroll', &scroll)
endfunction

function! s:preview_scroll() abort
  let l:winid = get(g:, '_fall_component_preview_winid')
  if !l:winid
    return &scroll
  endif
  return getwinvar(l:winid, '&l:scroll', &scroll)
endfunction

if !get(g:, 'fall_disable_default_mapping')
  function! s:map_picker() abort
    " Cursor
    cnoremap <nowait><buffer> <C-p> <Plug>(fall-cursor-prev)
    cnoremap <nowait><buffer> <C-n> <Plug>(fall-cursor-next)
    cnoremap <nowait><buffer> <Up> <Plug>(fall-cursor-prev)
    cnoremap <nowait><buffer> <Down> <Plug>(fall-cursor-next)
    cnoremap <nowait><buffer> <C-u> <Plug>(fall-cursor-scroll-prev)
    cnoremap <nowait><buffer> <C-d> <Plug>(fall-cursor-scroll-next)
    cnoremap <nowait><buffer> <PageUp> <Plug>(fall-cursor-scroll-prev)
    cnoremap <nowait><buffer> <PageDown> <Plug>(fall-cursor-scroll-next)
    cnoremap <nowait><buffer> <C-t> <Plug>(fall-cursor-first)
    cnoremap <nowait><buffer> <C-g> <Plug>(fall-cursor-last)
    cnoremap <nowait><buffer> <Home> <Plug>(fall-cursor-first)
    cnoremap <nowait><buffer> <End> <Plug>(fall-cursor-last)
    " Select
    cnoremap <nowait><buffer> <C-,> <Plug>(fall-select)
    cnoremap <nowait><buffer> <C-.> <Plug>(fall-select-all)
    cnoremap <nowait><buffer> <C-j> <Plug>(fall-select)<Plug>(fall-cursor-next)
    cnoremap <nowait><buffer> <C-k> <Plug>(fall-cursor-prev)<Plug>(fall-select)
    " Action
    cnoremap <nowait><buffer> <Tab> <Plug>(fall-action-select)
    cnoremap <nowait><buffer> <Return> <Plug>(fall-action-default)
    " Preview
    cnoremap <nowait><buffer> <C-Up> <Plug>(fall-preview-prev)
    cnoremap <nowait><buffer> <C-Down> <Plug>(fall-preview-next)
    cnoremap <nowait><buffer> <C-PageUp> <Plug>(fall-preview-scroll-prev)
    cnoremap <nowait><buffer> <C-PageDown> <Plug>(fall-preview-scroll-next)
    cnoremap <nowait><buffer> <C-Home> <Plug>(fall-preview-first)
    cnoremap <nowait><buffer> <C-End> <Plug>(fall-preview-last)
    cnoremap <nowait><buffer> <C-Left> <Plug>(fall-preview-scroll-left)
    cnoremap <nowait><buffer> <C-Right> <Plug>(fall-preview-scroll-right)
    cnoremap <nowait><buffer> <C-9> <Plug>(fall-preview-previewer-prev)
    cnoremap <nowait><buffer> <C-0> <Plug>(fall-preview-previewer-next)
  endfunction

  augroup fall_mapping_plugin
    autocmd!
    autocmd User FallPickerEnter:* call s:map_picker()
  augroup END
endif
