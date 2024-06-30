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
    cnoremap <nowait> <C-p> <Plug>(fall-cursor-prev)
    cnoremap <nowait> <C-n> <Plug>(fall-cursor-next)
    cnoremap <nowait> <Up> <Plug>(fall-cursor-prev)
    cnoremap <nowait> <Down> <Plug>(fall-cursor-next)
    cnoremap <nowait> <C-u> <Plug>(fall-cursor-scroll-prev)
    cnoremap <nowait> <C-d> <Plug>(fall-cursor-scroll-next)
    cnoremap <nowait> <PageUp> <Plug>(fall-cursor-scroll-prev)
    cnoremap <nowait> <PageDown> <Plug>(fall-cursor-scroll-next)
    cnoremap <nowait> <C-t> <Plug>(fall-cursor-first)
    cnoremap <nowait> <C-g> <Plug>(fall-cursor-last)
    cnoremap <nowait> <Home> <Plug>(fall-cursor-first)
    cnoremap <nowait> <End> <Plug>(fall-cursor-last)
    " Select
    cnoremap <nowait> <C-,> <Plug>(fall-select)
    cnoremap <nowait> <C-.> <Plug>(fall-select-all)
    cnoremap <nowait> <C-j> <Plug>(fall-select)<Plug>(fall-cursor-next)
    cnoremap <nowait> <C-k> <Plug>(fall-cursor-prev)<Plug>(fall-select)
    " Action
    cnoremap <nowait> <Tab> <Plug>(fall-action-select)
    cnoremap <nowait> <Return> <Plug>(fall-action-default)
    " Preview
    cnoremap <nowait> <C-Up> <Plug>(fall-preview-prev)
    cnoremap <nowait> <C-Down> <Plug>(fall-preview-next)
    cnoremap <nowait> <C-PageUp> <Plug>(fall-preview-scroll-prev)
    cnoremap <nowait> <C-PageDown> <Plug>(fall-preview-scroll-next)
    cnoremap <nowait> <C-Home> <Plug>(fall-preview-first)
    cnoremap <nowait> <C-End> <Plug>(fall-preview-last)
    cnoremap <nowait> <C-Left> <Plug>(fall-preview-scroll-left)
    cnoremap <nowait> <C-Right> <Plug>(fall-preview-scroll-right)
    cnoremap <nowait> <C-9> <Plug>(fall-preview-previewer-prev)
    cnoremap <nowait> <C-0> <Plug>(fall-preview-previewer-next)
  endfunction

  augroup fall_mapping_plugin
    autocmd!
    autocmd User FallPickerEnter:* call s:map_picker()
  augroup END
endif
